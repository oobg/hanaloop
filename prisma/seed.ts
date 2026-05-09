import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Product
  const product = await prisma.product.upsert({
    where: { code: "CT-045" },
    update: {},
    create: { code: "CT-045", name: "컴퓨터 화면" },
  });

  // Emission factors (Excel 기준값)
  const factors = [
    {
      id: "ef-elec-kr-2025",
      factorKey: "EF_ELECTRICITY_KR",
      version: 1,
      activityType: "ELECTRICITY",
      description: "한국전력 기본값",
      value: 0.456,
      unit: "kgCO2e/kWh",
      scope: "SCOPE_2",
      validFrom: new Date("2025-01-01"),
      validTo: null,
    },
    {
      id: "ef-raw-plastic1-2025",
      factorKey: "EF_RAW_PLASTIC1",
      version: 1,
      activityType: "RAW_MATERIAL",
      description: "플라스틱 1",
      value: 2.3,
      unit: "kgCO2e/kg",
      scope: "SCOPE_3",
      validFrom: new Date("2025-01-01"),
      validTo: null,
    },
    {
      id: "ef-raw-plastic2-2025",
      factorKey: "EF_RAW_PLASTIC2",
      version: 1,
      activityType: "RAW_MATERIAL",
      description: "플라스틱 2",
      value: 3.2,
      unit: "kgCO2e/kg",
      scope: "SCOPE_3",
      validFrom: new Date("2025-01-01"),
      validTo: null,
    },
    {
      id: "ef-transport-truck-2025",
      factorKey: "EF_TRANSPORT_TRUCK",
      version: 1,
      activityType: "TRANSPORT",
      description: "트럭",
      value: 3.5,
      unit: "kgCO2e/ton-km",
      scope: "SCOPE_3",
      validFrom: new Date("2025-01-01"),
      validTo: null,
    },
  ];

  for (const f of factors) {
    await prisma.emissionFactor.upsert({
      where: { factorKey_version: { factorKey: f.factorKey, version: f.version } },
      update: { value: f.value, description: f.description },
      create: f,
    });
  }

  // Activity data (CT-045, from Excel)
  const electricityFactor = await prisma.emissionFactor.findFirst({ where: { factorKey: "EF_ELECTRICITY_KR" } });
  const plastic1Factor = await prisma.emissionFactor.findFirst({ where: { factorKey: "EF_RAW_PLASTIC1" } });
  const plastic2Factor = await prisma.emissionFactor.findFirst({ where: { factorKey: "EF_RAW_PLASTIC2" } });
  const truckFactor = await prisma.emissionFactor.findFirst({ where: { factorKey: "EF_TRANSPORT_TRUCK" } });

  const activityRows = [
    // 전기 (kWh)
    { date: "2025-01-01", activityType: "ELECTRICITY", description: "한국전력", amount: 110, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-02-01", activityType: "ELECTRICITY", description: "한국전력", amount: 112, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-03-01", activityType: "ELECTRICITY", description: "한국전력", amount: 115, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-04-01", activityType: "ELECTRICITY", description: "한국전력", amount: 130, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-05-01", activityType: "ELECTRICITY", description: "한국전력", amount: 120, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-05-01", activityType: "ELECTRICITY", description: "한국전력", amount: 101, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-06-01", activityType: "ELECTRICITY", description: "한국전력", amount: 110, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-07-01", activityType: "ELECTRICITY", description: "한국전력", amount: 120, unit: "kWh", efId: electricityFactor?.id },
    { date: "2025-08-01", activityType: "ELECTRICITY", description: "한국전력", amount: 111, unit: "kWh", efId: electricityFactor?.id },
    // 원소재 - 플라스틱 1 (kg)
    { date: "2025-01-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 230, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-02-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 340, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-03-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 430, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-04-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 510, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-05-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 424, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-05-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 232, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-06-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 450, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-07-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 340, unit: "kg", efId: plastic1Factor?.id },
    { date: "2025-08-01", activityType: "RAW_MATERIAL", description: "플라스틱 1", amount: 230, unit: "kg", efId: plastic1Factor?.id },
    // 원소재 - 플라스틱 2 (kg)
    { date: "2025-03-01", activityType: "RAW_MATERIAL", description: "플라스틱 2", amount: 23, unit: "kg", efId: plastic2Factor?.id },
    { date: "2025-05-01", activityType: "RAW_MATERIAL", description: "플라스틱 2", amount: 40, unit: "kg", efId: plastic2Factor?.id },
    { date: "2025-07-01", activityType: "RAW_MATERIAL", description: "플라스틱 2", amount: 43, unit: "kg", efId: plastic2Factor?.id },
    // 운송 - 트럭 (ton-km)
    { date: "2025-01-01", activityType: "TRANSPORT", description: "트럭", amount: 41, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-02-01", activityType: "TRANSPORT", description: "트럭", amount: 211, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-03-01", activityType: "TRANSPORT", description: "트럭", amount: 123, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-04-01", activityType: "TRANSPORT", description: "트럭", amount: 42, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-05-01", activityType: "TRANSPORT", description: "트럭", amount: 123, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-05-01", activityType: "TRANSPORT", description: "트럭", amount: 12, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-06-01", activityType: "TRANSPORT", description: "트럭", amount: 123, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-07-01", activityType: "TRANSPORT", description: "트럭", amount: 41, unit: "ton-km", efId: truckFactor?.id },
    { date: "2025-08-01", activityType: "TRANSPORT", description: "트럭", amount: 123, unit: "ton-km", efId: truckFactor?.id },
  ];

  // Clear existing activity data for this product before seeding
  await prisma.activityData.deleteMany({ where: { productId: product.id } });

  for (const row of activityRows) {
    await prisma.activityData.create({
      data: {
        productId: product.id,
        date: new Date(row.date),
        activityType: row.activityType,
        description: row.description,
        amount: row.amount,
        unit: row.unit,
        emissionFactorId: row.efId ?? null,
      },
    });
  }

  console.log(`Seeded: 1 product, ${factors.length} emission factors, ${activityRows.length} activity records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
