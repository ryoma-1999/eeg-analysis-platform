resource "azurerm_container_registry" "eeg" {
  name                = "eeganalysisacr"
  resource_group_name = azurerm_resource_group.eeg.name
  location            = azurerm_resource_group.eeg.location
  sku                 = "Basic"
  admin_enabled       = false
}