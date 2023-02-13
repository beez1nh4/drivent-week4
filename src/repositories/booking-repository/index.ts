import { prisma } from "@/config";
  
async function findBookingByUsedId(userId: number) {
    return prisma.booking.findFirst({
      where: {
        userId
      },
      select: {
        id: true,
        Room: true,
      }
    });
}

async function createBooking(userId: number, roomId: number) {
    return prisma.booking.create({
      data: {
        userId,
        roomId
      }
    });
}

async function updateBooking(bookingId: number, roomId: number) {
    return prisma.booking.update({
      where:{
        id: bookingId
      } , 
      data: {
        roomId
      }
    });
  }


const bookingRepository = {
    findBookingByUsedId,
    createBooking,
    updateBooking
  };
  
  export default bookingRepository;










