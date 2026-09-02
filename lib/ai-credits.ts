import { randomUUID } from "node:crypto";
import {
  aiCreditCosts,
  initialAICreditBalance,
  type AICreditOperation,
} from "@/lib/ai-credit-config";
import { db } from "@/lib/db";

export { aiCreditCosts, initialAICreditBalance } from "@/lib/ai-credit-config";
export type { AICreditOperation } from "@/lib/ai-credit-config";
export type AICreditTransactionKind = "grant" | "refund" | "spend";

export type AICreditTransaction = {
  amount: number;
  balanceAfter: number;
  createdAt: string;
  description: string;
  id: string;
  kind: AICreditTransactionKind;
  operation: string | null;
  referenceId: string | null;
};

export type AICreditAccount = {
  balance: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  recentTransactions: AICreditTransaction[];
};

type WalletRow = {
  balance: number;
  lifetime_granted: number;
  lifetime_spent: number;
};

type TransactionRow = {
  amount: number;
  balance_after: number;
  created_at: string;
  description: string;
  id: string;
  kind: AICreditTransactionKind;
  operation: string | null;
  reference_id: string | null;
};

export type SpendAICreditInput = {
  amount: number;
  description: string;
  operation: AICreditOperation;
  referenceId: string;
};

export type RefundAICreditInput = {
  description: string;
  operation: AICreditOperation;
  spendReferenceId: string;
};

export type AICreditMutationResult = {
  applied: boolean;
  balance: number;
  transaction: AICreditTransaction;
};

export class AICreditError extends Error {
  constructor(
    public readonly code: "IDEMPOTENCY_CONFLICT" | "INSUFFICIENT_CREDITS" | "INVALID_CREDIT_MUTATION",
    message: string,
    public readonly balance?: number,
  ) {
    super(message);
    this.name = "AICreditError";
  }
}

function mapTransaction(row: TransactionRow): AICreditTransaction {
  return {
    amount: row.amount,
    balanceAfter: row.balance_after,
    createdAt: row.created_at,
    description: row.description,
    id: row.id,
    kind: row.kind,
    operation: row.operation,
    referenceId: row.reference_id,
  };
}

function getWalletRow(userId: string) {
  return db.prepare(
    `SELECT balance, lifetime_granted, lifetime_spent
     FROM ai_credit_wallets
     WHERE user_id = ?`,
  ).get(userId) as WalletRow | undefined;
}

function ensureWalletRow(userId: string) {
  const now = new Date().toISOString();
  const inserted = db.prepare(
    `INSERT OR IGNORE INTO ai_credit_wallets
      (user_id, balance, lifetime_granted, lifetime_spent, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, ?)`,
  ).run(userId, initialAICreditBalance, initialAICreditBalance, now, now);

  if (inserted.changes > 0) {
    db.prepare(
      `INSERT INTO ai_credit_transactions
        (id, user_id, kind, amount, balance_after, operation, reference_id, description, created_at)
       VALUES (?, ?, 'grant', ?, ?, NULL, ?, ?, ?)`,
    ).run(
      randomUUID(),
      userId,
      initialAICreditBalance,
      initialAICreditBalance,
      "welcome-grant-v1",
      "Başlangıç kredisi",
      now,
    );
  }

  const wallet = getWalletRow(userId);
  if (!wallet) throw new Error("AI kredi cüzdanı oluşturulamadı.");
  return wallet;
}

const ensureWalletTransaction = db.transaction(ensureWalletRow);

export function ensureAICreditWallet(userId: string) {
  return ensureWalletTransaction(userId);
}

export function getAICreditAccount(userId: string, transactionLimit = 8): AICreditAccount {
  const wallet = ensureAICreditWallet(userId);
  const safeLimit = Number.isFinite(transactionLimit)
    ? Math.max(0, Math.min(25, Math.trunc(transactionLimit)))
    : 8;
  const rows = safeLimit === 0
    ? []
    : db.prepare(
      `SELECT id, kind, amount, balance_after, operation, reference_id, description, created_at
       FROM ai_credit_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC, rowid DESC
       LIMIT ?`,
    ).all(userId, safeLimit) as TransactionRow[];

  return {
    balance: wallet.balance,
    lifetimeGranted: wallet.lifetime_granted,
    lifetimeSpent: wallet.lifetime_spent,
    recentTransactions: rows.map(mapTransaction),
  };
}

function validateSpendMutation(mutation: SpendAICreditInput) {
  if (!Number.isSafeInteger(mutation.amount) || mutation.amount <= 0 || mutation.amount > 100_000) {
    throw new AICreditError("INVALID_CREDIT_MUTATION", "Kredi miktarı geçersiz.");
  }
  if (
    !mutation.referenceId.trim() ||
    mutation.referenceId !== mutation.referenceId.trim() ||
    mutation.referenceId.length > 160
  ) {
    throw new AICreditError("INVALID_CREDIT_MUTATION", "Kredi işlem referansı geçersiz.");
  }
  if (!mutation.description.trim() || mutation.description.length > 180) {
    throw new AICreditError("INVALID_CREDIT_MUTATION", "Kredi işlem açıklaması geçersiz.");
  }
}

function getTransactionByReference(userId: string, referenceId: string) {
  return db.prepare(
    `SELECT id, kind, amount, balance_after, operation, reference_id, description, created_at
     FROM ai_credit_transactions
     WHERE user_id = ? AND reference_id = ?`,
  ).get(userId, referenceId) as TransactionRow | undefined;
}

function assertMatchingIdempotentTransaction(
  existing: TransactionRow,
  kind: AICreditTransactionKind,
  signedAmount: number,
  operation: AICreditOperation,
) {
  if (
    existing.kind !== kind ||
    existing.amount !== signedAmount ||
    existing.operation !== operation
  ) {
    throw new AICreditError(
      "IDEMPOTENCY_CONFLICT",
      "Aynı işlem referansı farklı bir kredi hareketinde kullanılmış.",
      existing.balance_after,
    );
  }
}

const spendTransaction = db.transaction((userId: string, mutation: SpendAICreditInput) => {
  validateSpendMutation(mutation);
  ensureWalletRow(userId);

  const existing = getTransactionByReference(userId, mutation.referenceId);
  if (existing) {
    assertMatchingIdempotentTransaction(existing, "spend", -mutation.amount, mutation.operation);
    return {
      applied: false,
      balance: getWalletRow(userId)!.balance,
      transaction: mapTransaction(existing),
    };
  }

  const now = new Date().toISOString();
  const updated = db.prepare(
    `UPDATE ai_credit_wallets
     SET balance = balance - ?, lifetime_spent = lifetime_spent + ?, updated_at = ?
     WHERE user_id = ? AND balance >= ?`,
  ).run(mutation.amount, mutation.amount, now, userId, mutation.amount);

  if (updated.changes === 0) {
    const balance = getWalletRow(userId)?.balance || 0;
    throw new AICreditError(
      "INSUFFICIENT_CREDITS",
      "Bu işlem için yeterli AI kredisi bulunmuyor.",
      balance,
    );
  }

  const balance = getWalletRow(userId)!.balance;
  const row: TransactionRow = {
    amount: -mutation.amount,
    balance_after: balance,
    created_at: now,
    description: mutation.description.trim(),
    id: randomUUID(),
    kind: "spend",
    operation: mutation.operation,
    reference_id: mutation.referenceId,
  };
  db.prepare(
    `INSERT INTO ai_credit_transactions
      (id, user_id, kind, amount, balance_after, operation, reference_id, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    userId,
    row.kind,
    row.amount,
    row.balance_after,
    row.operation,
    row.reference_id,
    row.description,
    row.created_at,
  );

  return { applied: true, balance, transaction: mapTransaction(row) };
});

export function spendAICredits(userId: string, mutation: SpendAICreditInput): AICreditMutationResult {
  return spendTransaction(userId, mutation);
}

const refundTransaction = db.transaction((userId: string, mutation: RefundAICreditInput) => {
  if (
    !mutation.spendReferenceId.trim() ||
    mutation.spendReferenceId !== mutation.spendReferenceId.trim() ||
    mutation.spendReferenceId.length > 153 ||
    !mutation.description.trim() ||
    mutation.description.length > 180
  ) {
    throw new AICreditError("INVALID_CREDIT_MUTATION", "Kredi iade bilgisi geçersiz.");
  }
  ensureWalletRow(userId);

  const spend = getTransactionByReference(userId, mutation.spendReferenceId);
  if (!spend || spend.kind !== "spend" || spend.operation !== mutation.operation) {
    throw new AICreditError(
      "INVALID_CREDIT_MUTATION",
      "İade edilecek kredi harcaması bulunamadı.",
      getWalletRow(userId)!.balance,
    );
  }

  const amount = -spend.amount;
  const refundReferenceId = `refund:${mutation.spendReferenceId}`;

  const existing = getTransactionByReference(userId, refundReferenceId);
  if (existing) {
    assertMatchingIdempotentTransaction(existing, "refund", amount, mutation.operation);
    return {
      applied: false,
      balance: getWalletRow(userId)!.balance,
      transaction: mapTransaction(existing),
    };
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE ai_credit_wallets
     SET balance = balance + ?, lifetime_spent = MAX(0, lifetime_spent - ?), updated_at = ?
     WHERE user_id = ?`,
  ).run(amount, amount, now, userId);
  const balance = getWalletRow(userId)!.balance;
  const row: TransactionRow = {
    amount,
    balance_after: balance,
    created_at: now,
    description: mutation.description.trim(),
    id: randomUUID(),
    kind: "refund",
    operation: mutation.operation,
    reference_id: refundReferenceId,
  };
  db.prepare(
    `INSERT INTO ai_credit_transactions
      (id, user_id, kind, amount, balance_after, operation, reference_id, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    userId,
    row.kind,
    row.amount,
    row.balance_after,
    row.operation,
    row.reference_id,
    row.description,
    row.created_at,
  );

  return { applied: true, balance, transaction: mapTransaction(row) };
});

export function refundAICredits(userId: string, mutation: RefundAICreditInput): AICreditMutationResult {
  return refundTransaction(userId, mutation);
}
