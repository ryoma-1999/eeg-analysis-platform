resource "azurerm_resource_group" "eeg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    project     = "eeg-analysis-platform"
    environment = "demo"
    managed_by  = "terraform"
  }
}