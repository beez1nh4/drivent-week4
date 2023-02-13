import { BookingType } from "@/protocols";
import Joi from "joi";

export const BookingSchema = Joi.object <BookingType>({
    roomId: Joi.number().required()
})