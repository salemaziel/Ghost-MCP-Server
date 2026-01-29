import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockContextLogger } from '../../__tests__/helpers/mockLogger.js';
import { mockDotenv } from '../../__tests__/helpers/testUtils.js';

// Mock the Ghost Admin API with webhooks support
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
      users: {
        browse: vi.fn(),
        read: vi.fn(),
        edit: vi.fn(),
        delete: vi.fn(),
      },
      webhooks: {
        add: vi.fn(),
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
  createWebhook,
  updateWebhook,
  deleteWebhook,
  api,
  ghostCircuitBreaker,
} from '../ghostServiceImproved.js';

describe('ghostServiceImproved - Webhooks', () => {
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

  describe('createWebhook', () => {
    it('should successfully create a webhook with required fields', async () => {
      const webhookData = {
        event: 'post.published',
        target_url: 'https://example.com/webhook',
      };

      const mockWebhook = {
        webhooks: [
          {
            id: '1',
            event: 'post.published',
            target_url: 'https://example.com/webhook',
            status: 'available',
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      api.webhooks.add.mockResolvedValue(mockWebhook);

      const result = await createWebhook(webhookData);

      expect(api.webhooks.add).toHaveBeenCalled();
      expect(result).toEqual(mockWebhook.webhooks[0]);
      expect(result.event).toBe('post.published');
    });

    it('should successfully create webhook with optional fields', async () => {
      const webhookData = {
        event: 'member.added',
        target_url: 'https://example.com/members',
        name: 'Member Notifications',
        secret: 'my-secret-key',
        api_version: 'v5.0',
      };

      const mockWebhook = {
        webhooks: [
          {
            id: '2',
            ...webhookData,
            status: 'available',
          },
        ],
      };

      api.webhooks.add.mockResolvedValue(mockWebhook);

      const result = await createWebhook(webhookData);

      expect(result.name).toBe('Member Notifications');
      expect(result.secret).toBe('my-secret-key');
    });

    it('should handle webhook creation errors', async () => {
      const webhookData = {
        event: 'post.published',
        target_url: 'https://example.com/webhook',
      };

      const mockError = new Error('Failed to create webhook');
      api.webhooks.add.mockRejectedValue(mockError);

      await expect(createWebhook(webhookData)).rejects.toThrow();
    });

    it('should throw error for invalid webhook data', async () => {
      await expect(createWebhook(null)).rejects.toThrow();
    });

    it('should throw error for non-object webhook data', async () => {
      await expect(createWebhook('invalid')).rejects.toThrow();
    });
  });

  describe('updateWebhook', () => {
    it('should successfully update webhook event', async () => {
      const updateData = {
        event: 'post.published.edited',
      };

      const mockUpdatedWebhook = {
        webhooks: [
          {
            id: '1',
            event: 'post.published.edited',
            target_url: 'https://example.com/webhook',
            updated_at: '2024-01-02T00:00:00.000Z',
          },
        ],
      };

      api.webhooks.edit.mockResolvedValue(mockUpdatedWebhook);

      const result = await updateWebhook('1', updateData);

      expect(api.webhooks.edit).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedWebhook.webhooks[0]);
      expect(result.event).toBe('post.published.edited');
    });

    it('should successfully update webhook target URL', async () => {
      const updateData = {
        target_url: 'https://new.example.com/webhook',
      };

      const mockUpdatedWebhook = {
        webhooks: [
          {
            id: '1',
            event: 'post.published',
            target_url: 'https://new.example.com/webhook',
          },
        ],
      };

      api.webhooks.edit.mockResolvedValue(mockUpdatedWebhook);

      const result = await updateWebhook('1', updateData);

      expect(result.target_url).toBe('https://new.example.com/webhook');
    });

    it('should successfully update webhook name', async () => {
      const updateData = {
        name: 'Updated Webhook Name',
      };

      const mockUpdatedWebhook = {
        webhooks: [
          {
            id: '1',
            name: 'Updated Webhook Name',
          },
        ],
      };

      api.webhooks.edit.mockResolvedValue(mockUpdatedWebhook);

      const result = await updateWebhook('1', updateData);

      expect(result.name).toBe('Updated Webhook Name');
    });

    it('should handle webhook update errors', async () => {
      const updateData = { event: 'member.edited' };
      const mockError = new Error('Failed to update webhook');
      api.webhooks.edit.mockRejectedValue(mockError);

      await expect(updateWebhook('1', updateData)).rejects.toThrow();
    });

    it('should handle updating non-existent webhook (404)', async () => {
      const updateData = { event: 'member.deleted' };
      const mockError = new Error('Webhook not found');
      mockError.response = { status: 404 };
      api.webhooks.edit.mockRejectedValue(mockError);

      await expect(updateWebhook('nonexistent', updateData)).rejects.toThrow();
    });

    it('should throw error for invalid webhook ID', async () => {
      const updateData = { event: 'post.published' };
      await expect(updateWebhook('', updateData)).rejects.toThrow();
    });

    it('should throw error for non-string webhook ID', async () => {
      const updateData = { event: 'post.published' };
      await expect(updateWebhook(123, updateData)).rejects.toThrow();
    });

    it('should throw error for invalid update data', async () => {
      await expect(updateWebhook('1', null)).rejects.toThrow();
    });
  });

  describe('deleteWebhook', () => {
    it('should successfully delete a webhook', async () => {
      api.webhooks.delete.mockResolvedValue({ success: true });

      const result = await deleteWebhook('1');

      expect(api.webhooks.delete).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it('should handle webhook deletion errors', async () => {
      const mockError = new Error('Failed to delete webhook');
      api.webhooks.delete.mockRejectedValue(mockError);

      await expect(deleteWebhook('1')).rejects.toThrow();
    });

    it('should handle deleting non-existent webhook (404)', async () => {
      const mockError = new Error('Webhook not found');
      mockError.response = { status: 404 };
      api.webhooks.delete.mockRejectedValue(mockError);

      await expect(deleteWebhook('nonexistent')).rejects.toThrow();
    });

    it('should throw error for invalid webhook ID', async () => {
      await expect(deleteWebhook('')).rejects.toThrow();
    });

    it('should throw error for non-string webhook ID', async () => {
      await expect(deleteWebhook(null)).rejects.toThrow();
    });
  });
});
