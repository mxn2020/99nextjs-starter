import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export const prismaHelpers = {
  softDelete: (where: any) => ({
    ...where,
    deletedAt: null,
  }),
  
  paginate: (page: number = 1, pageSize: number = 10) => ({
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  
  orderByCreated: (direction: 'asc' | 'desc' = 'desc') => ({
    orderBy: { createdAt: direction },
  }),
};

export async function prismaTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as PrismaClient);
  });
}