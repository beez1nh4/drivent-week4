import { prisma } from "@/config";
  
async function findBookingById(bookingId: number) {
    return prisma.booking.findFirst({
      where: {
        id: bookingId,
      },
      include: {
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
    findBookingById,
    createBooking,
    updateBooking
  };
  
  export default bookingRepository;










