const { ExploreFeedItemSchema } = require('../../schemas/ExploreFeedItem');

const mockBusinessProfile = {
  id: 'business-001',
  ownerId: 'user-001',
  displayName: 'Potongin Studio',
  tagline: 'Neighborhood barber profile placeholder',
  address: 'Jakarta, Indonesia',
  phone: '+62 812-0000-0000',
  isClaimed: false,
};

const mockExploreFeedItems = ExploreFeedItemSchema.array().parse([
  {
    id: 'feed-001',
    type: 'barber',
    title: 'Classic Fade Specialist',
    subtitle: 'Mock discovery profile for feed integration',
  },
  {
    id: 'feed-002',
    type: 'style',
    title: 'Textured Crop Inspiration',
    subtitle: 'Mock inspiration card for the explore feed',
  },
]);

const mockBarbershops = [
  {
    id: 'barber-001',
    name: 'Potongin Studio',
    specialty: 'Textured cuts and modern fades',
    location: 'South Jakarta',
    status: 'verified',
  },
  {
    id: 'barber-002',
    name: 'Rooftop Clippers',
    specialty: 'Classic side parts and beard cleanup',
    location: 'Central Jakarta',
    status: 'verified',
  },
];

function createMockAnalyzeResult(request) {
  return {
    request,
    analysisId: 'analysis-mock-001',
    result: {
      faceShape: 'oval',
      hairCondition: 'normal',
      recommendations: ['textured crop', 'low taper', 'classic side part'],
    },
  };
}

function createMockGenerateResult(request) {
  return {
    request,
    generationId: 'generate-mock-001',
    previews: [
      {
        id: 'preview-001',
        styleName: 'Textured Crop',
        imageUrl: 'https://example.com/mock-preview-1.jpg',
      },
      {
        id: 'preview-002',
        styleName: 'Modern Pompadour',
        imageUrl: 'https://example.com/mock-preview-2.jpg',
      },
    ],
  };
}

function createMockBarbershopClaim(submittedData) {
  return {
    claimId: 'claim-mock-001',
    status: 'pending_review',
    submittedData,
  };
}

function createMockProfile(profileId) {
  return {
    id: profileId,
    email: 'demo@potongin.ai',
    displayName: 'Demo User',
    role: 'regular',
    credits: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function createMockTransaction(payload) {
  return {
    id: 'txn-mock-001',
    userId: payload.userId,
    amount: payload.amount ?? 0,
    creditsAdded: payload.creditsAdded ?? 0,
    status: 'pending',
    paymentGatewayRef: payload.paymentGatewayRef ?? null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

module.exports = {
  createMockAnalyzeResult,
  createMockBarbershopClaim,
  createMockGenerateResult,
  createMockProfile,
  createMockTransaction,
  mockBarbershops,
  mockBusinessProfile,
  mockExploreFeedItems,
};
