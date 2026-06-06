export type CollaborationItem = {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  package: {
    id: string
    title: string
    thumbnailUrl: string | null
    mediaType: string
    price: string
  }
  brand: {
    username: string
    email: string
  }
}

export type UploadedFile = {
  url: string
  type: string
}

export type ContentStatus = "NOT_SUBMITTED" | "SUBMITTED" | "IMPROVEMENT_REQUESTED" | "APPROVED" | "REJECTED"

export type ContentModalState = {
  collabId: string | null
  collab: CollaborationItem | null
  contentStatus: ContentStatus | null
  uploadedFiles: UploadedFile[]
  isOpen: boolean
}
