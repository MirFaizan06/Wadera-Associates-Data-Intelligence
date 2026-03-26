import { prismaMock } from './setup';
import { checkUserLicense, assignLicense, revokeLicense } from '../services/license.service';

describe('License Service', () => {
  describe('checkUserLicense', () => {
    it('returns false when no licenses', async () => {
      prismaMock.licenseAssignment.findMany.mockResolvedValue([]);
      const result = await checkUserLicense('user1', 'ds1', 'VIEW');
      expect(result).toBe(false);
    });

    it('returns true when user has valid VIEW license for all datasets', async () => {
      prismaMock.licenseAssignment.findMany.mockResolvedValue([
        {
          id: 'lic1',
          userId: 'user1',
          isActive: true,
          validFrom: new Date(Date.now() - 1000),
          validTo: null,
          datasetIds: null,
          licenseType: { permissions: ['VIEW', 'DOWNLOAD'] },
        },
      ] as never);

      const result = await checkUserLicense('user1', 'ds1', 'VIEW');
      expect(result).toBe(true);
    });

    it('returns false when license does not have required permission', async () => {
      prismaMock.licenseAssignment.findMany.mockResolvedValue([
        {
          id: 'lic1',
          isActive: true,
          validFrom: new Date(Date.now() - 1000),
          validTo: null,
          datasetIds: null,
          licenseType: { permissions: ['VIEW'] },
        },
      ] as never);

      const result = await checkUserLicense('user1', 'ds1', 'DOWNLOAD');
      expect(result).toBe(false);
    });

    it('returns false when license is restricted to different datasets', async () => {
      prismaMock.licenseAssignment.findMany.mockResolvedValue([
        {
          id: 'lic1',
          isActive: true,
          validFrom: new Date(Date.now() - 1000),
          validTo: null,
          datasetIds: ['other-ds-id'],
          licenseType: { permissions: ['VIEW', 'DOWNLOAD'] },
        },
      ] as never);

      const result = await checkUserLicense('user1', 'ds1', 'DOWNLOAD');
      expect(result).toBe(false);
    });

    it('returns true when license is restricted to matching dataset', async () => {
      prismaMock.licenseAssignment.findMany.mockResolvedValue([
        {
          id: 'lic1',
          isActive: true,
          validFrom: new Date(Date.now() - 1000),
          validTo: null,
          datasetIds: ['ds1'],
          licenseType: { permissions: ['VIEW', 'DOWNLOAD'] },
        },
      ] as never);

      const result = await checkUserLicense('user1', 'ds1', 'DOWNLOAD');
      expect(result).toBe(true);
    });
  });

  describe('assignLicense', () => {
    it('throws NotFoundError if license type not found', async () => {
      prismaMock.licenseType.findUnique.mockResolvedValue(null);
      await expect(assignLicense('user1', 'nonexistent-lt-id'))
        .rejects.toMatchObject({ statusCode: 404 });
    });

    it('creates license assignment with validTo for limited licenses', async () => {
      prismaMock.licenseType.findUnique.mockResolvedValue({
        id: 'lt1',
        name: 'View Only',
        validDays: 365,
        permissions: ['VIEW'],
      } as never);
      prismaMock.licenseAssignment.create.mockResolvedValue({} as never);

      await assignLicense('user1', 'lt1');
      expect(prismaMock.licenseAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            validTo: expect.any(Date),
          }),
        })
      );
    });

    it('creates license assignment with null validTo for perpetual licenses', async () => {
      prismaMock.licenseType.findUnique.mockResolvedValue({
        id: 'lt2',
        name: 'Full Access',
        validDays: null,
        permissions: ['VIEW', 'DOWNLOAD', 'API_ACCESS'],
      } as never);
      prismaMock.licenseAssignment.create.mockResolvedValue({} as never);

      await assignLicense('user1', 'lt2');
      expect(prismaMock.licenseAssignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ validTo: null }),
        })
      );
    });
  });

  describe('revokeLicense', () => {
    it('throws NotFoundError if license not found', async () => {
      prismaMock.licenseAssignment.findUnique.mockResolvedValue(null);
      await expect(revokeLicense('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('sets isActive to false and records revocation', async () => {
      prismaMock.licenseAssignment.findUnique.mockResolvedValue({ id: 'lic1' } as never);
      prismaMock.licenseAssignment.update.mockResolvedValue({} as never);

      await revokeLicense('lic1', 'Admin revoked');
      expect(prismaMock.licenseAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: false,
            revokedReason: 'Admin revoked',
          }),
        })
      );
    });
  });
});
