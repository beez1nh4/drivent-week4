import { prisma } from "@/config";
  
async function findRoomById(roomId: number) {
    return prisma.room.findFirst({
      where: {
        id: roomId
      }
    });
}

async function getNumberOfBookingsByRoomId(roomId:number) {
    return prisma.room.findFirst({
        where: {
          id: roomId,
        },
        include: {
          _count: { select: { Booking: true } },
        },
      });
}

const roomRepository = {
    findRoomById,
    getNumberOfBookingsByRoomId
  };
  
  export default roomRepository;
