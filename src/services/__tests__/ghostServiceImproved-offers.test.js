import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockContextLogger } from '../../__tests__/helpers/mockLogger.js';
import { mockDotenv } from '../../__tests__/helpers/testUtils.js';

// Mock the Ghost Admin API with offers support
vi.mock('@tryghost/admin-api', () => ({
  default: vi.fn(function () {
    return {
      posts: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      pages: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      tags: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      members: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      tiers: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      offers: {
        add: vi.fn(),
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      site: {
        read: vi.fn(),
      },
      images: {
        upload: vi.fn(),
      },
    };
  }),
}));

// Mock dotenv
vi.mock('dotenv', () => mockDotenv());

// Mock logger
vi.mock('../../utils/logger.js', () => ({
  createContextLogger: createMockContextLogger(),
}));

// Mock fs for validateImagePath
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
  },
}));

// Import after setting up mocks
import {
  createOffer,
  updateOffer,
  deleteOffer,
  getOffers,
  getOffer,
  api,
  ghostCircuitBreaker,
} from '../ghostServiceImproved.js';

describe('ghostServiceImproved - Offers', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset circuit breaker to closed state
    if (ghostCircuitBreaker) {
      ghostCircuitBreaker.state = 'CLOSED';
      ghostCircuitBreaker.failureCount = 0;
      ghostCircuitBreaker.lastFailureTime = null;
      ghostCircuitBreaker.nextAttempt = null;
    }
  });

  describe('getOffers', () => {
    it('should successfully fetch all offers', async () => {
      const mockOffers = [
        {
          id: '1',
          name: 'Black Friday Sale',
          code: 'BLACKFRIDAY',
          type: 'percent',
          amount: 20,
          cadence: 'month',
          duration: 'once',
          tier: { id: 'tier-1', name: 'Premium' },
        },
        {
          id: '2',
          name: 'New Year Trial',
          code: 'NEWYEAR2024',
          type: 'trial',
          amount: 7,
          cadence: 'month',
          duration: 'trial',
          tier: { id: 'tier-2', name: 'Pro' },
        },
      ];

      api.offers.browse.mockResolvedValue(mockOffers);

      const result = await getOffers();

      expect(api.offers.browse).toHaveBeenCalled();
      expect(result).toEqual(mockOffers);
    });

    it('should successfully fetch offers with pagination', async () => {
      const mockOffers = [
        {
          id: '1',
          name: 'Summer Sale',
          code: 'SUMMER2024',
          type: 'percent',
          amount: 25,
        },
      ];

      api.offers.browse.mockResolvedValue(mockOffers);

      const result = await getOffers({ limit: 1, page: 1 });

      expect(api.offers.browse).toHaveBeenCalled();
      expect(result).toEqual(mockOffers);
    });

    it('should successfully fetch offers with filter', async () => {
      const mockOffers = [
        {
          id: '1',
          name: 'Trial Offer',
          code: 'TRIAL30',
          type: 'trial',
          amount: 30,
        },
      ];

      api.offers.browse.mockResolvedValue(mockOffers);

      const result = await getOffers({ filter: 'type:trial' });

      expect(api.offers.browse).toHaveBeenCalled();
      expect(result).toEqual(mockOffers);
    });

    it('should handle offers browse errors', async () => {
      const mockError = new Error('Failed to fetch offers');
      api.offers.browse.mockRejectedValue(mockError);

      await expect(getOffers()).rejects.toThrow();
    });

    it('should handle empty offers array', async () => {
      api.offers.browse.mockResolvedValue([]);

      const result = await getOffers();

      expect(result).toEqual([]);
    });
  });

  describe('getOffer', () => {
    it('should successfully fetch offer by ID', async () => {
      const mockOffer = {
        id: '1',
        name: 'Black Friday Sale',
        code: 'BLACKFRIDAY',
        type: 'percent',
        amount: 20,
        cadence: 'month',
        duration: 'once',
        tier: { id: 'tier-1', name: 'Premium' },
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      api.offers.read.mockResolvedValue(mockOffer);

      const result = await getOffer('1');

      expect(api.offers.read).toHaveBeenCalled();
      expect(result).toEqual(mockOffer);
    });

    it('should handle offer not found (404)', async () => {
      const mockError = new Error('Offer not found');
      mockError.response = { status: 404 };
      api.offers.read.mockRejectedValue(mockError);

      await expect(getOffer('nonexistent')).rejects.toThrow();
    });

    it('should handle offer read errors', async () => {
      const mockError = new Error('Failed to read offer');
      api.offers.read.mockRejectedValue(mockError);

      await expect(getOffer('1')).rejects.toThrow();
    });
  });

  describe('createOffer', () => {
    it('should successfully create a percent offer', async () => {
      const offerData = {
        name: 'Spring Sale',
        code: 'SPRING2024',
        type: 'percent',
        amount: 15,
        cadence: 'month',
        duration: 'once',
        tier_id: 'tier-1',
      };

      const mockCreatedOffer = {
        id: '123',
        ...offerData,
        tier: { id: 'tier-1', name: 'Premium' },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      api.offers.add.mockResolvedValue(mockCreatedOffer);

      const result = await createOffer(offerData);

      expect(api.offers.add).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedOffer);
      expect(result.id).toBe('123');
      expect(result.name).toBe('Spring Sale');
      expect(result.type).toBe('percent');
    });

    it('should successfully create a fixed amount offer', async () => {
      const offerData = {
        name: 'Fixed Discount',
        code: 'FIXED10',
        type: 'fixed',
        amount: 1000, // $10.00 in cents
        cadence: 'month',
        duration: 'repeating',
        duration_in_months: 3,
        tier_id: 'tier-2',
      };

      const mockCreatedOffer = {
        id: '456',
        ...offerData,
        tier: { id: 'tier-2', name: 'Pro' },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      api.offers.add.mockResolvedValue(mockCreatedOffer);

      const result = await createOffer(offerData);

      expect(api.offers.add).toHaveBeenCalled();
      expect(result.type).toBe('fixed');
      expect(result.amount).toBe(1000);
      expect(result.duration).toBe('repeating');
      expect(result.duration_in_months).toBe(3);
    });

    it('should successfully create a trial offer', async () => {
      const offerData = {
        name: '14 Day Trial',
        code: 'TRIAL14',
        type: 'trial',
        amount: 14,
        cadence: 'month',
        duration: 'trial',
        tier_id: 'tier-1',
      };

      const mockCreatedOffer = {
        id: '789',
        ...offerData,
        tier: { id: 'tier-1', name: 'Premium' },
        created_at: '2024-01-01T00:00:00.000Z',
      };

      api.offers.add.mockResolvedValue(mockCreatedOffer);

      const result = await createOffer(offerData);

      expect(api.offers.add).toHaveBeenCalled();
      expect(result.type).toBe('trial');
      expect(result.duration).toBe('trial');
    });

    it('should handle offer creation errors', async () => {
      const offerData = {
        name: 'Invalid Offer',
        code: 'INVALID',
        type: 'percent',
        amount: 50,
        cadence: 'month',
        duration: 'once',
        tier_id: 'tier-1',
      };

      const mockError = new Error('Failed to create offer');
      api.offers.add.mockRejectedValue(mockError);

      await expect(createOffer(offerData)).rejects.toThrow();
    });

    it('should handle validation errors for required fields', async () => {
      const invalidOffer = {
        name: 'Incomplete Offer',
        // Missing required fields: code, type, amount, cadence, duration, tier_id
      };

      // Validation happens at schema level, so this should throw before API call
      await expect(createOffer(invalidOffer)).rejects.toThrow();
    });
  });

  describe('updateOffer', () => {
    it('should successfully update offer display fields', async () => {
      const updateData = {
        name: 'Updated Sale Name',
        display_title: 'Amazing Sale!',
        display_description: 'Get 20% off now',
      };

      const mockUpdatedOffer = {
        id: '1',
        code: 'BLACKFRIDAY',
        type: 'percent',
        amount: 20,
        ...updateData,
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      api.offers.edit.mockResolvedValue(mockUpdatedOffer);

      const result = await updateOffer('1', updateData);

      expect(api.offers.edit).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedOffer);
      expect(result.name).toBe('Updated Sale Name');
    });

    it('should handle offer update errors', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = new Error('Failed to update offer');
      api.offers.edit.mockRejectedValue(mockError);

      await expect(updateOffer('1', updateData)).rejects.toThrow();
    });

    it('should handle updating non-existent offer (404)', async () => {
      const updateData = { name: 'Updated Name' };
      const mockError = new Error('Offer not found');
      mockError.response = { status: 404 };
      api.offers.edit.mockRejectedValue(mockError);

      await expect(updateOffer('nonexistent', updateData)).rejects.toThrow();
    });
  });

  describe('deleteOffer', () => {
    it('should successfully delete an offer', async () => {
      api.offers.delete.mockResolvedValue({ success: true });

      const result = await deleteOffer('1');

      expect(api.offers.delete).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle offer deletion errors', async () => {
      const mockError = new Error('Failed to delete offer');
      api.offers.delete.mockRejectedValue(mockError);

      await expect(deleteOffer('1')).rejects.toThrow();
    });

    it('should handle deleting non-existent offer (404)', async () => {
      const mockError = new Error('Offer not found');
      mockError.response = { status: 404 };
      api.offers.delete.mockRejectedValue(mockError);

      await expect(deleteOffer('nonexistent')).rejects.toThrow();
    });

    it('should handle deleting offer with active redemptions', async () => {
      const mockError = new Error('Cannot delete offer with active redemptions');
      mockError.response = { status: 409 };
      api.offers.delete.mockRejectedValue(mockError);

      await expect(deleteOffer('1')).rejects.toThrow();
    });
  });
});
