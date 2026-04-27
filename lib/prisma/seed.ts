

import prisma from "./prisma";



async function main() {
 
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());