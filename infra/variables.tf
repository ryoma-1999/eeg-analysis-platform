variable "resource_group_name" {
  type        = string
  description = "Name of the Azure Resource Group"
  default     = "eeg-rg"
}

variable "location" {
  type        = string
  description = "Azure region for resources"
  default     = "Japan East"
}