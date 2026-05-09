/**
 * @template T
 * @typedef {object} ApiSuccessResponse
 * @property {true} success
 * @property {T} data
 * @property {string=} message
 */

/**
 * @typedef {object} ApiErrorResponse
 * @property {false} success
 * @property {{ code: string, message: string }} error
 */

/**
 * @typedef {object} AnalyzePhotoRequest
 * @property {string} photoSessionId
 * @property {string=} imageBase64
 * @property {'image/jpeg' | 'image/png' | 'image/webp'=} mimeType
 * @property {number=} width
 * @property {number=} height
 * @property {string=} source
 * @property {string=} selectedStyleId
 * @property {string=} selectedHairColor
 * @property {string=} notes
 */

/**
 * @typedef {object} AnalyzePhotoResponse
 * @property {AnalyzePhotoRequest} request
 * @property {string} analysisId
 * @property {'mock' | 'real'=} modeUsed
 * @property {{
 *   faceShape: string,
 *   hairType?: string,
 *   hairCondition: string,
 *   currentHairNotes?: string,
 *   recommendations: string[],
 *   recommendationGroups?: {
 *     palingCocok?: object[],
 *     alternatifAman?: object[],
 *     lebihBerani?: object[]
 *   },
 *   avoidStyles?: string[],
 *   stylingNotes?: string,
 *   confidence?: number
 * }} result
 * @property {{ id: string, name: string, colorFamily: string } | null=} selectedHairColor
 */

/**
 * @typedef {object} GeneratePreviewRequest
 * @property {string} prompt
 * @property {string=} imageBase64
 * @property {'image/jpeg' | 'image/png' | 'image/webp'=} mimeType
 * @property {string=} analysisId
 * @property {string=} photoSessionId
 * @property {string=} source
 * @property {string=} selectedStyleId
 * @property {string=} selectedStyleName
 * @property {string=} selectedHairColor
 * @property {number=} variations
 */

/**
 * @typedef {object} GeneratePreviewResponse
 * @property {GeneratePreviewRequest} request
 * @property {string} generationId
 * @property {'mock' | 'real'=} modeUsed
 * @property {string=} previewUrl
 * @property {string=} previewBase64
 * @property {string=} styleName
 * @property {string | null=} hairColor
 * @property {string=} notes
 * @property {{ id: string, styleName: string, imageUrl: string }[]} previews
 */

/**
 * @typedef {object} ExploreFeedItem
 * @property {string} id
 * @property {'barber' | 'style'} type
 * @property {string} title
 * @property {string} subtitle
 */

/**
 * @typedef {object} BarberClaimRequest
 * @property {string} barberId
 * @property {string} contactName
 * @property {string} phoneNumber
 * @property {string=} proofUrl
 * @property {string=} notes
 */

/**
 * @typedef {object} BusinessProfileUpdateRequest
 * @property {string=} displayName
 * @property {string=} tagline
 * @property {string=} address
 * @property {string=} phone
 */

/**
 * @typedef {object} SavedHistoryItem
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} previewUrl
 * @property {number} previewCount
 * @property {string} savedAt
 */

/**
 * @typedef {object} BetaProfile
 * @property {string} id
 * @property {string} name
 * @property {string} plan
 * @property {string} role
 * @property {number} credits
 * @property {boolean} beta
 * @property {string} apiBaseUrl
 * @property {string | null} updatedAt
 */

/**
 * @typedef {object} SelectedLocalPhoto
 * @property {string} uri
 * @property {number} width
 * @property {number} height
 * @property {'camera' | 'gallery'} sourceType
 * @property {string=} fileName
 * @property {string=} mimeType
 * @property {string=} base64
 * @property {File=} file
 */

/**
 * @typedef {object} ConfirmPhotoUploadResponse
 * @property {string} photoSessionId
 * @property {string | null} originalImageTempUrl
 * @property {string | null} localUri
 * @property {string | null} originalLocalUri
 * @property {string} source
 * @property {number | null} width
 * @property {number | null} height
 * @property {'confirmed_mock' | 'confirmed_uploaded'} status
 * @property {'mock' | 'supabase'} storageMode
 * @property {string} expiresAt
 */

export const mobileApiContracts = {};
