resource "azurerm_user_assigned_identity" "container_apps" {
  name                = "id-eeg-container-apps"
  location            = azurerm_resource_group.eeg.location
  resource_group_name = azurerm_resource_group.eeg.name
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                            = azurerm_container_registry.eeg.id
  role_definition_name             = "AcrPull"
  principal_id                     = azurerm_user_assigned_identity.container_apps.principal_id
  skip_service_principal_aad_check = true
}