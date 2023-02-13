import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import bookingService from "@/services/bookings-service";
import httpStatus from "http-status";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getBooking(Number(userId));
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "ForbiddenError"){
        return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  try {
    const booking = await bookingService.postBooking(Number(userId), Number(roomId));

    return res.status(httpStatus.OK).send(booking.id);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "ForbiddenError"){
        return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "RoomFullError"){
        return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
    const { userId } = req;
    const { bookingId } = req.params;
    const { roomId } = req.body;
  
    try {
      const booking = await bookingService.updateBooking(Number(userId), Number(roomId), Number(bookingId));
  
      return res.status(httpStatus.OK).send(booking.id);
    } catch (error) {
      if (error.name === "NotFoundError") {
        return res.sendStatus(httpStatus.NOT_FOUND);
      }
      if (error.name === "ForbiddenError"){
          return res.sendStatus(httpStatus.FORBIDDEN);
      }
      if (error.name === "RoomFullError"){
          return res.sendStatus(httpStatus.FORBIDDEN);
      }
      return res.sendStatus(httpStatus.BAD_REQUEST);
    }
  }