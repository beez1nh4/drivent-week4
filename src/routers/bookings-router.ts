import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getBooking, postBooking, updateBooking } from "@/controllers";
import { BookingSchema } from "@/schemas/booking-schema";

const bookingsRouter = Router();

bookingsRouter
  .get("/", authenticateToken, getBooking)
  .post("/", authenticateToken, validateBody(BookingSchema),postBooking)
  .put("/:bookingId", authenticateToken, validateBody(BookingSchema), updateBooking);

export { bookingsRouter };













