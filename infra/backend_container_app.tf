resource "azurerm_container_app" "backend" {
  name                         = "ca-eeg-backend"
  container_app_environment_id = azurerm_container_app_environment.eeg.id
  resource_group_name          = azurerm_resource_group.eeg.name
  revision_mode                = "Single"

  identity {
    type = "UserAssigned"

    identity_ids = [
      azurerm_user_assigned_identity.container_apps.id
    ]
  }

  registry {
    server   = azurerm_container_registry.eeg.login_server
    identity = azurerm_user_assigned_identity.container_apps.id
  }

  template {
    min_replicas = 0
    max_replicas = 1

    container {
      name   = "backend"
      image  = "${azurerm_container_registry.eeg.login_server}/eeg-backend:${var.backend_image_tag}"
      cpu    = 0.5
      memory = "1Gi"
    }
  }

  ingress {
    external_enabled = false
    target_port      = 8000
    transport        = "http"

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  depends_on = [
    azurerm_role_assignment.acr_pull
  ]
}