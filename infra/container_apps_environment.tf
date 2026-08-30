resource "azurerm_container_app_environment" "eeg" {
  name                = "cae-eeg-analysis"
  location            = azurerm_resource_group.eeg.location
  resource_group_name = azurerm_resource_group.eeg.name

  logs_destination           = "log-analytics"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.eeg.id
}