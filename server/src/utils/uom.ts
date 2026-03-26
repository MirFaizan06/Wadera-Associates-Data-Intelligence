import { prisma } from './prisma';

export async function convertUnit(value: number, fromUnit: string, toUnit: string): Promise<number | null> {
  if (fromUnit === toUnit) return value;

  const conversion = await prisma.unitConversion.findUnique({
    where: { fromUnit_toUnit: { fromUnit, toUnit } },
  });

  if (!conversion) return null;
  return value * conversion.factor;
}

export async function getAvailableConversions(fromUnit: string): Promise<string[]> {
  const conversions = await prisma.unitConversion.findMany({
    where: { fromUnit },
    select: { toUnit: true },
  });
  return conversions.map(c => c.toUnit);
}
