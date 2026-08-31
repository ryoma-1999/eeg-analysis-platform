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
  cpu    = 1
  memory = "2Gi"

  liveness_probe {
    transport               = "TCP"
    port                    = 8000
    initial_delay           = 0
    interval_seconds        = 10
    timeout                 = 5
    failure_count_threshold = 3
  }

  readiness_probe {
    transport               = "TCP"
    port                    = 8000
    initial_delay           = 0
    interval_seconds        = 5
    timeout                 = 5
    failure_count_threshold = 48
    success_count_threshold = 1
  }

  startup_probe {
    transport               = "TCP"
    port                    = 8000
    initial_delay           = 1
    interval_seconds        = 1
    timeout                 = 3
    failure_count_threshold = 240
  }
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