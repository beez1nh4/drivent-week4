import { ApplicationError } from "@/protocols";

export function roomFullError(): ApplicationError {
  return {
    name: "RoomFullError",
    message: "This room is occupied!",
  };
}