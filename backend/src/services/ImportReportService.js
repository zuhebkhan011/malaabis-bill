class ImportReportService {
  /**
   * Compiles performance and import statistics metrics.
   * @param {Array} products 
   * @param {number} startTime - Date.now() timestamp when import process started.
   */
  static compileReport(products, startTime) {
    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const productsImported = products.length;
    const existingUpdated = products.filter(p => p.matchStatus === "exact").length;
    const newCreated = products.filter(p => p.matchStatus === "new").length;
    const stockIncreased = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
    const totalPurchaseValue = products.reduce(
      (acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.purchasePrice) || 0)), 
      0
    );

    return {
      productsImported,
      existingUpdated,
      newCreated,
      stockIncreased,
      totalPurchaseValue,
      importDuration: `${durationSeconds} seconds`
    };
  }
}

module.exports = ImportReportService;
