import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching user...");
    const user = await prisma.user.findUnique({
        where: { email: 'gisozi.retailer@big.co.rw' }
    });

    if (!user) {
        console.log("User not found!");
        return;
    }
    console.log("User ID:", user.id);

    const retailer = await prisma.retailerProfile.findUnique({
        where: { userId: user.id }
    });

    if (!retailer) {
        console.log("Retailer profile not found!");
        return;
    }
    console.log("Retailer ID:", retailer.id);

    const sales = await prisma.sale.findMany({
        where: { retailerId: retailer.id },
        include: {
            saleItems: true
        }
    });

    console.log(`\nTotal Sales found: ${sales.length}`);
    sales.forEach(sale => {
        console.log(`Sale ID: ${sale.id} | Status: ${sale.status} | Items: ${sale.saleItems.length} | Amount: ${sale.totalAmount} | Date: ${sale.createdAt}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
