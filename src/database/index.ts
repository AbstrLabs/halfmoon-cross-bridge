export { TableName };

// TODO [new table]: use new tables
enum TableName {
  MINT_ACTIVE = `mint_request`,
  BURN_ACTIVE = `burn_request`,
  MINT_FINISHED = `mint_archive`,
  BURN_FINISHED = `burn_archive`,
  MINT_MANUAL = `mint_manual`,
  BURN_MANUAL = `burn_manual`,
}
