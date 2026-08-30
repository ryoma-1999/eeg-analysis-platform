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

variable "backend_image_tag" {
  type    = string
  default = "v1"
}

variable "frontend_image_tag" {
  type    = string
  default = "v3"
}