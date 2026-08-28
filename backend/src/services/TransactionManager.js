const mongoose = require("mongoose");

class TransactionManager {
  /**
   * Executes the given operation inside a MongoDB transaction session.
   * If transactions are not supported by the MongoDB deployment (e.g. standalone local instance),
   * it falls back to a non-transactional execution.
   * @param {function} operationFn - Async function taking (session) and returning a result.
   */
  static async runInTransaction(operationFn) {
    let session = null;
    try {
      session = await mongoose.startSession();
    } catch (sessionErr) {
      // Standalone MongoDB doesn't support sessions
      console.log("[TransactionManager] sessions/transactions not supported by MongoDB deployment. Fallback to manual execution.");
    }

    if (session) {
      try {
        session.startTransaction();
        const result = await operationFn(session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        console.error("[TransactionManager] Error in transaction. Aborting...", error);
        await session.abortTransaction().catch(() => null);
        throw error;
      } finally {
        await session.endSession().catch(() => null);
      }
    } else {
      // Non-transactional fallback execution
      return await operationFn(null);
    }
  }
}

module.exports = TransactionManager;
