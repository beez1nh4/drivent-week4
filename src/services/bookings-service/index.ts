import enrollmentRepository from "@/repositories/enrollment-repository";
import bookingRepository from "@/repositories/booking-repository";
import { forbiddenError, notFoundError, roomFullError, unauthorizedError } from "@/errors";
import ticketRepository from "@/repositories/ticket-repository";
import roomRepository from "@/repositories/room-repository";

async function getBooking(userId: number) {
  
  checkIfBookingIsAllowed(userId); 

  const booking = await bookingRepository.findBookingByUsedId(userId)

  if (!booking) {
    throw notFoundError();
  }

  return booking;
}

async function postBooking(userId: number, roomId: number) {

  checkIfBookingIsAllowed(userId);

  await checkRoom(roomId);

  const booking = await bookingRepository.createBooking(userId, roomId)

  return booking
}

async function updateBooking(userId: number, roomId: number, bookingId: number) {

  checkIfBookingIsAllowed(userId);

  const booking = await bookingRepository.findBookingByUsedId(userId)

  if (!booking) {
    throw notFoundError();
  }

  if(booking.id !== bookingId){
    throw unauthorizedError();
  }

  await checkRoom(roomId);

  const bookingUpdate = await bookingRepository.updateBooking(booking.id, roomId)

  return bookingUpdate;
}

async function checkRoom(roomId:number) {
  const room = await roomRepository.findRoomById(roomId);

  if (!room){
    throw notFoundError();
  }

  const roomBooking = await roomRepository.getNumberOfBookingsByRoomId(roomId)

  if(roomBooking._count.Booking >= room.capacity){
    throw roomFullError();
  }

  return room
}

async function checkIfBookingIsAllowed(userId:number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw forbiddenError();
  }
  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);

  if (!ticket || ticket.status === "RESERVED" || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw forbiddenError();
  }
}

const bookingService = {
  getBooking,
  postBooking,
  updateBooking
};

export default bookingService;
