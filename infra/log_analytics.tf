resource "azurerm_log_analytics_workspace" "eeg" {
  name                = "log-eeg-analysis"
  resource_group_name = azurerm_resource_group.eeg.name
  location            = azurerm_resource_group.eeg.location

  sku               = "PerGB2018"
  retention_in_days = 30
}