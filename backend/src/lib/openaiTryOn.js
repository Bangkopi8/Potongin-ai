const { env, getOpenAiApiKey } = require('../config/env');
const {
  getHairColorById,
  getHairColorCatalogSummary,
  getHaircutCatalogSummary,
  getHaircutStyleById,
} = require('./productCatalogBridge');

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_IMAGE_EDITS_URL = 'https://api.openai.com/v1/images/edits';
const ACCEPTED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_OPENAI_IMAGE_MODELS = new Set(['gpt-image-1']);
const OPENAI_IMAGE_INPUT_FIDELITY = 'high';
const MAX_INLINE_IMAGE_BYTES = 5 * 1024 * 1024;

function createAiModeError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.name = code;
  return error;
}

function estimateBase64Bytes(base64Value) {
  if (typeof base64Value !== 'string' || base64Value.length === 0) {
    return 0;
  }

  const normalized = base64Value.replace(/\s+/g, '');
  const paddingMatches = normalized.match(/=+$/);
  const paddingLength = paddingMatches ? paddingMatches[0].length : 0;

  return Math.floor((normalized.length * 3) / 4) - paddingLength;
}

function normalizeAcceptedImageMimeType(mimeType) {
  if (typeof mimeType !== 'string' || mimeType.trim().length === 0) {
    return 'image/jpeg';
  }

  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (!ACCEPTED_IMAGE_MIME_TYPES.has(normalizedMimeType)) {
    throw createAiModeError(
      'IMAGE_INPUT_INVALID',
      'Only JPEG, PNG, or WebP photos are supported for the real AI try-on preview flow.'
    );
  }

  return normalizedMimeType;
}

function sanitizeInlineImagePayload({ imageBase64, mimeType }) {
  if (typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
    throw createAiModeError(
      'IMAGE_INPUT_INVALID',
      'A confirmed photo with real image data is required for the real AI try-on preview flow.'
    );
  }

  const normalizedMimeType = normalizeAcceptedImageMimeType(mimeType);
  const trimmedBase64 = imageBase64.trim();
  const estimatedBytes = estimateBase64Bytes(trimmedBase64);

  if (!Number.isFinite(estimatedBytes) || estimatedBytes <= 0) {
    throw createAiModeError(
      'IMAGE_PREPROCESS_FAILED',
      'The selected photo could not be prepared for the real AI try-on preview.'
    );
  }

  if (estimatedBytes > MAX_INLINE_IMAGE_BYTES) {
    throw createAiModeError(
      'IMAGE_INPUT_INVALID',
      'Selected photo is too large for the real AI try-on preview. Please choose a smaller or more compressed image.'
    );
  }

  let binaryBuffer;

  try {
    binaryBuffer = Buffer.from(trimmedBase64, 'base64');
  } catch {
    throw createAiModeError(
      'IMAGE_PREPROCESS_FAILED',
      'The selected photo could not be decoded for the real AI try-on preview.'
    );
  }

  if (!Buffer.isBuffer(binaryBuffer) || binaryBuffer.length === 0) {
    throw createAiModeError(
      'IMAGE_PREPROCESS_FAILED',
      'The selected photo could not be decoded for the real AI try-on preview.'
    );
  }

  return {
    base64: trimmedBase64,
    binaryBuffer,
    mimeType: normalizedMimeType,
    estimatedBytes,
    dataUrl: `data:${normalizedMimeType};base64,${trimmedBase64}`,
  };
}

function resolveSupportedImageModel() {
  const configuredModel =
    typeof env.OPENAI_IMAGE_MODEL === 'string' ? env.OPENAI_IMAGE_MODEL.trim() : '';

  if (!SUPPORTED_OPENAI_IMAGE_MODELS.has(configuredModel)) {
    throw createAiModeError(
      'IMAGE_MODEL_UNSUPPORTED',
      `OPENAI_IMAGE_MODEL=${configuredModel || '(missing)'} is not supported for the real AI try-on preview flow. Use gpt-image-1.`
    );
  }

  return configuredModel;
}

function resolveAiMode() {
  if (env.NODE_ENV === 'test' && process.env.ENABLE_REAL_AI_TESTS !== 'true') {
    return 'mock';
  }

  const requestedMode = env.AI_MODE === 'real' ? 'real' : 'mock';
  const apiKey = getOpenAiApiKey();

  if (requestedMode === 'real') {
    if (apiKey) {
      return 'real';
    }

    throw createAiModeError(
      'AI_REAL_MODE_UNAVAILABLE',
      'AI_MODE=real requires OPENAI_API_KEY on the backend before live try-on can run.'
    );
  }

  return requestedMode;
}

function buildAnalyzeSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      faceShape: { type: 'string' },
      hairType: { type: 'string' },
      currentHairNotes: { type: 'string' },
      palingCocok: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            styleId: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['styleId', 'reason'],
        },
      },
      alternatifAman: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            styleId: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['styleId', 'reason'],
        },
      },
      lebihBerani: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            styleId: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['styleId', 'reason'],
        },
      },
      avoidStyles: {
        type: 'array',
        items: { type: 'string' },
      },
      stylingNotes: { type: 'string' },
      confidence: { type: 'number' },
    },
    required: [
      'faceShape',
      'hairType',
      'currentHairNotes',
      'palingCocok',
      'alternatifAman',
      'lebihBerani',
      'avoidStyles',
      'stylingNotes',
      'confidence',
    ],
  };
}

async function postOpenAiJson(url, payload) {
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getOpenAiApiKey()}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(90_000),
    });
  } catch (caughtError) {
    const error = createAiModeError(
      'AI_ANALYSIS_FAILED',
      caughtError?.message || 'OpenAI analysis request failed before a response was received.'
    );
    error.status = null;
    error.openAiErrorCode = caughtError?.code || caughtError?.cause?.code || null;
    throw error;
  }

  const parsedBody = await response.json().catch(() => null);

  if (!response.ok) {
    const error = createAiModeError(
      'AI_ANALYSIS_FAILED',
      parsedBody?.error?.message || `OpenAI request failed with status ${response.status}.`
    );
    error.status = response.status;
    error.openAiErrorCode = parsedBody?.error?.code || null;
    throw error;
  }

  return parsedBody;
}

async function postOpenAiForm(url, formData) {
  let response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getOpenAiApiKey()}`,
      },
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });
  } catch (caughtError) {
    const error = createAiModeError(
      'IMAGE_REQUEST_FAILED',
      caughtError?.message || 'OpenAI image request failed before a response was received.'
    );
    error.status = null;
    error.openAiErrorCode = caughtError?.code || caughtError?.cause?.code || null;
    throw error;
  }

  const parsedBody = await response.json().catch(() => null);

  if (!response.ok) {
    const openAiErrorCode = parsedBody?.error?.code || null;
    const errorCode =
      openAiErrorCode === 'model_not_found' ||
      openAiErrorCode === 'unsupported_model' ||
      response.status === 404
        ? 'IMAGE_MODEL_UNSUPPORTED'
        : 'IMAGE_REQUEST_FAILED';
    const error = createAiModeError(
      errorCode,
      parsedBody?.error?.message || `OpenAI image request failed with status ${response.status}.`
    );
    error.status = response.status;
    error.openAiErrorCode = openAiErrorCode;
    throw error;
  }

  return parsedBody;
}

function extractResponseText(responseBody) {
  if (typeof responseBody?.output_text === 'string' && responseBody.output_text.trim().length > 0) {
    return responseBody.output_text;
  }

  const outputItems = Array.isArray(responseBody?.output) ? responseBody.output : [];

  for (const outputItem of outputItems) {
    const contentItems = Array.isArray(outputItem?.content) ? outputItem.content : [];

    for (const contentItem of contentItems) {
      if (typeof contentItem?.text === 'string' && contentItem.text.trim().length > 0) {
        return contentItem.text;
      }
    }
  }

  return '';
}

function buildCatalogLookup(catalogItems) {
  return new Map((Array.isArray(catalogItems) ? catalogItems : []).map((item) => [item.id, item]));
}

function mapRecommendationGroupItems(groupItems, lookup) {
  return (Array.isArray(groupItems) ? groupItems : [])
    .slice(0, 3)
    .map((entry) => {
      if (!entry?.styleId) {
        return null;
      }

      const style = lookup.get(entry.styleId);

      if (!style) {
        return null;
      }

      return {
        id: style.id,
        styleId: style.id,
        kind: 'style',
        title: style.name,
        subtitle: style.stylingNotes || style.barberInstruction || 'Local AI recommendation',
        description:
          style.stylingNotes ||
          `A ${style.maintenanceLevel} maintenance ${style.categories?.[0] || 'haircut'} direction.`,
        shortDescription:
          style.stylingNotes ||
          `A ${style.maintenanceLevel} maintenance ${style.categories?.[0] || 'haircut'} direction.`,
        category: Array.isArray(style.categories) && style.categories.length > 0 ? style.categories[0] : 'Curated',
        maintenance: style.maintenanceLevel || 'medium',
        maintenanceLevel: style.maintenanceLevel || 'medium',
        riskLevel: style.riskLevel || 'medium',
        regionTrend: style.popularityRegion || 'Global',
        popularityRegion: style.popularityRegion || 'Global',
        genderFit: style.genderFit || 'unisex',
        genderTarget: style.genderFit || 'unisex',
        length: style.length || 'medium',
        trendScore: Number.isFinite(style.trendScore) ? style.trendScore : 0,
        vibeTags: Array.isArray(style.vibeTags) ? style.vibeTags : [],
        tags: Array.isArray(style.recommendationTags) ? style.recommendationTags : [],
        barberInstruction: style.barberInstruction || '',
        reason:
          typeof entry.reason === 'string' && entry.reason.trim().length > 0
            ? entry.reason.trim()
            : 'Selected by the real AI recommendation pass.',
      };
    })
    .filter(Boolean);
}

function buildPromptContext({
  selectedStyle,
  selectedHairColor,
  notes,
}) {
  const contextParts = [];

  if (selectedStyle?.name) {
    contextParts.push(
      `Preferred haircut if possible: ${selectedStyle.name} (${selectedStyle.genderFit || 'unisex'}, ${selectedStyle.length || 'medium'}, ${Array.isArray(selectedStyle.categories) ? selectedStyle.categories.join(', ') : 'curated'}).`
    );
  }

  if (selectedHairColor?.name) {
    contextParts.push(
      `Preferred hair color direction: ${selectedHairColor.name} (${selectedHairColor.colorFamily}, ${selectedHairColor.undertone || 'neutral'} undertone).`
    );
  }

  if (typeof notes === 'string' && notes.trim().length > 0) {
    contextParts.push(`User notes: ${notes.trim()}`);
  }

  return contextParts.join('\n');
}

async function generateRealAnalyzeResult(request) {
  const inlineImage = sanitizeInlineImagePayload(request);
  const styleCatalog = await getHaircutCatalogSummary();
  const colorCatalog = await getHairColorCatalogSummary();
  const selectedStyle = await getHaircutStyleById(request.selectedStyleId);
  const selectedHairColor = await getHairColorById(request.selectedHairColor);
  const catalogLookup = buildCatalogLookup(styleCatalog);
  const promptContext = buildPromptContext({
    selectedStyle,
    selectedHairColor,
    notes: request.notes,
  });

  console.info('[ai][analyze] real mode request', {
    source: request.source || 'unknown',
    mimeType: inlineImage.mimeType,
    estimatedBytes: inlineImage.estimatedBytes,
    selectedStyleName: selectedStyle?.name || request.selectedStyleId || null,
    selectedHairColor: selectedHairColor?.name || request.selectedHairColor || null,
  });

  const responseBody = await postOpenAiJson(OPENAI_RESPONSES_URL, {
    model: env.OPENAI_ANALYZE_MODEL,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              'You are a hairstyle recommendation assistant for a consumer haircut try-on demo.',
              'Analyze the face and current hair from the image.',
              'Choose only haircut style IDs from the provided local style catalog.',
              'Return practical, compact recommendations grounded in the catalog.',
              'Keep the reasoning short and useful for a public beta mobile UI.',
              promptContext,
              `Haircut catalog: ${JSON.stringify(styleCatalog)}`,
              `Hair color catalog: ${JSON.stringify(colorCatalog)}`,
            ]
              .filter(Boolean)
              .join('\n\n'),
          },
          {
            type: 'input_image',
            image_url: inlineImage.dataUrl,
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'potongin_try_on_analysis',
        strict: true,
        schema: buildAnalyzeSchema(),
      },
    },
  });

  const outputText = extractResponseText(responseBody);
  let parsedResult;

  try {
    parsedResult = JSON.parse(outputText);
  } catch {
    throw createAiModeError(
      'AI_ANALYSIS_FAILED',
      'Real AI analysis did not return readable recommendation data.'
    );
  }

  const recommendationGroups = {
    palingCocok: mapRecommendationGroupItems(parsedResult.palingCocok, catalogLookup),
    alternatifAman: mapRecommendationGroupItems(parsedResult.alternatifAman, catalogLookup),
    lebihBerani: mapRecommendationGroupItems(parsedResult.lebihBerani, catalogLookup),
  };

  const flatRecommendations = Object.values(recommendationGroups)
    .flat()
    .slice(0, 4)
    .map((item) => item.title);

  console.info('[ai][analyze] real mode success', {
    analysisId: responseBody.id || null,
    selectedStyleName: selectedStyle?.name || request.selectedStyleId || null,
    selectedHairColor: selectedHairColor?.name || request.selectedHairColor || null,
    recommendationCounts: {
      palingCocok: recommendationGroups.palingCocok.length,
      alternatifAman: recommendationGroups.alternatifAman.length,
      lebihBerani: recommendationGroups.lebihBerani.length,
    },
  });

  return {
    request,
    analysisId: responseBody.id || `analysis-real-${Date.now()}`,
    modeUsed: 'real',
    result: {
      faceShape: parsedResult.faceShape || 'unknown',
      hairType: parsedResult.hairType || 'unknown',
      hairCondition: parsedResult.hairType || 'unknown',
      currentHairNotes:
        parsedResult.currentHairNotes || 'Real AI analysis completed for the current photo.',
      recommendations: flatRecommendations,
      recommendationGroups,
      avoidStyles: Array.isArray(parsedResult.avoidStyles) ? parsedResult.avoidStyles : [],
      stylingNotes: parsedResult.stylingNotes || 'Keep the haircut direction practical and wearable.',
      confidence:
        typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 0.65,
    },
    selectedHairColor: selectedHairColor
      ? {
          id: selectedHairColor.id,
          name: selectedHairColor.name,
          colorFamily: selectedHairColor.colorFamily,
        }
      : null,
  };
}

function buildGeneratePrompt({ selectedStyle, selectedHairColor, prompt }) {
  const promptParts = [
    'Edit the provided portrait photo into a realistic hairstyle try-on preview.',
    'This must remain the exact same person and the exact same photo composition, not a newly generated portrait.',
    'Identity preservation is the highest priority.',
    'Treat the face and every non-hair region as locked source content.',
    'Preserve the same face identity, face shape, eyes, nose, lips, jawline, eyebrows, skin tone, skin texture, expression, pose, camera angle, lighting, clothes, background, and framing.',
    'Do not beautify the face. Do not smooth skin. Do not retouch skin. Do not make the person look more AI-generated.',
    'Do not change age, ethnicity, facial proportions, facial geometry, facial symmetry, cheek structure, eye spacing, nose shape, lip shape, jawline, or expression.',
    'Only edit the hair area.',
    'Apply the selected hairstyle and selected hair color accurately while keeping the face unchanged.',
    'If exact hairstyle application conflicts with identity preservation, preserve identity first and apply the closest safe hair-only version of the selected hairstyle.',
    'Leave all non-hair pixels unchanged as much as possible.',
    'Keep the result photorealistic and natural.',
  ];

  if (selectedStyle?.name) {
    const styleCategoryLabel =
      Array.isArray(selectedStyle.categories) && selectedStyle.categories.length > 0
        ? selectedStyle.categories.slice(0, 3).join(', ')
        : 'curated';
    const styleDirection =
      selectedStyle.stylingNotes ||
      selectedStyle.barberInstruction ||
      'Keep the haircut clean, wearable, and true to the selected shape.';

    promptParts.push(
      `Haircut target: ${selectedStyle.name}. Length: ${selectedStyle.length || 'medium'}. Categories: ${styleCategoryLabel}. Hair direction: ${styleDirection}`
    );
  }

  if (selectedHairColor?.name) {
    promptParts.push(
      `Hair color target: ${selectedHairColor.name} with ${selectedHairColor.undertone || 'neutral'} undertone. Color family: ${selectedHairColor.colorFamily}. Notes: ${selectedHairColor.notes || 'Keep the color believable.'}`
    );
  }

  if (typeof prompt === 'string' && prompt.trim().length > 0) {
    promptParts.push(`User prompt: ${prompt.trim()}`);
  }

  promptParts.push(
    'Do not add hats, accessories, background edits, extra people, or unrelated makeup changes.'
  );

  return promptParts.join('\n\n');
}

async function generateRealPreviewResult(request) {
  const hasImageBase64 = typeof request?.imageBase64 === 'string' && request.imageBase64.trim().length > 0;

  try {
    const inlineImage = sanitizeInlineImagePayload(request);
    const imageModel = resolveSupportedImageModel();
    const selectedStyle =
      (await getHaircutStyleById(request.selectedStyleId)) ||
      (request.selectedStyleName
        ? {
            name: request.selectedStyleName,
            length: 'medium',
            categories: ['Curated'],
            barberInstruction: request.prompt,
          }
        : null);
    const selectedHairColor = await getHairColorById(request.selectedHairColor);
    const prompt = buildGeneratePrompt({
      selectedStyle,
      selectedHairColor,
      prompt: request.prompt,
    });

    console.info('[ai][generate] real mode request', {
      AI_MODE: env.AI_MODE,
      source: request.source || 'unknown',
      selectedStyleName:
        selectedStyle?.name || request.selectedStyleName || request.selectedStyleId || null,
      selectedHairColor: selectedHairColor?.name || request.selectedHairColor || null,
      hasImageBase64,
      approximateImagePayloadBytes: inlineImage.estimatedBytes,
      OPENAI_IMAGE_MODEL: imageModel,
    });

    const formData = new FormData();
    formData.append('model', imageModel);
    formData.append('prompt', prompt);
    formData.append('input_fidelity', OPENAI_IMAGE_INPUT_FIDELITY);

    const imageBlob = new Blob([inlineImage.binaryBuffer], {
      type: inlineImage.mimeType,
    });
    formData.append('image[]', imageBlob, `try-on.${inlineImage.mimeType.split('/')[1] || 'jpg'}`);

    console.info('[ai][generate] OpenAI image request starting', {
      AI_MODE: env.AI_MODE,
      OPENAI_IMAGE_MODEL: imageModel,
      selectedStyleName:
        selectedStyle?.name || request.selectedStyleName || request.selectedStyleId || null,
      selectedHairColor: selectedHairColor?.name || request.selectedHairColor || null,
      imageField: 'image[]',
      inputFidelity: OPENAI_IMAGE_INPUT_FIDELITY,
    });

    const responseBody = await postOpenAiForm(OPENAI_IMAGE_EDITS_URL, formData);
    const previewBase64 =
      typeof responseBody?.data?.[0]?.b64_json === 'string'
        ? responseBody.data[0].b64_json.trim()
        : '';
    const returnedPreviewUrl =
      typeof responseBody?.data?.[0]?.url === 'string' && responseBody.data[0].url.trim().length > 0
        ? responseBody.data[0].url.trim()
        : null;

    if (!previewBase64 && !returnedPreviewUrl) {
      throw createAiModeError(
        'IMAGE_RESPONSE_EMPTY',
        'Real AI preview finished but no image was returned.'
      );
    }

    const previewUrl = returnedPreviewUrl || `data:image/png;base64,${previewBase64}`;
    const styleName = selectedStyle?.name || request.selectedStyleName || 'Recommended Look';
    const colorName = selectedHairColor?.name || null;
    const generationId = `generate-real-${Date.now()}`;

    console.info('[ai][generate] OpenAI image request succeeded', {
      generationId,
      AI_MODE: env.AI_MODE,
      selectedStyleName: styleName,
      selectedHairColor: colorName,
      returnedPreviewBase64: Boolean(previewBase64),
      returnedPreviewUrl: Boolean(returnedPreviewUrl || previewUrl),
    });

    return {
      request,
      generationId,
      modeUsed: 'real',
      previewUrl,
      previewBase64,
      styleName,
      hairColor: colorName,
      notes:
        [
          selectedHairColor?.notes,
          selectedStyle?.stylingNotes,
          'Generated by the real AI demo try-on path.',
          'Identity preservation is strongly requested, but slight facial drift may still occur with current image-edit models.',
        ]
          .filter(Boolean)
          .join(' '),
      previews: [
        {
          id: `preview-real-${Date.now()}`,
          styleName,
          imageUrl: previewUrl,
        },
      ],
    };
  } catch (error) {
    console.error('[ai][generate] real mode failed', {
      AI_MODE: env.AI_MODE,
      selectedStyleName: request?.selectedStyleName || request?.selectedStyleId || null,
      selectedHairColor: request?.selectedHairColor || null,
      hasImageBase64,
      approximateImagePayloadBytes: hasImageBase64 ? estimateBase64Bytes(request.imageBase64) : 0,
      OPENAI_IMAGE_MODEL: env.OPENAI_IMAGE_MODEL,
      errorName: error?.name || 'Error',
      errorStatus: error?.status || null,
      errorCode: error?.code || error?.openAiErrorCode || null,
      errorMessage: error?.message || 'Unknown real preview error.',
    });
    throw error;
  }
}

module.exports = {
  createAiModeError,
  generateRealAnalyzeResult,
  generateRealPreviewResult,
  resolveAiMode,
};
