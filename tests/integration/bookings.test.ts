import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicket,
  createPayment,
  createTicketTypeRemote,
  createTicketTypeWithHotel,
  createHotel,
  createTicketTypeWithoutHotel,
  createTicketTypeHotel,
  createRoomWithHotelId,
  createBooking,
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);


describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {

    it("should respond with status 403 when user doesnt have an enrollment yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
    
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when user doesnt have a ticket yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        await createEnrollmentWithAddress(user);
    
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket doesnt include hotel", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeWithoutHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);

        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket is remote", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
      
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket isnt paid", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
      
      it("should respond with status 404 when booking doesnt exist", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
  
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
  
      });

      it("should respond with status 200 and booking data", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id, room.id)
  
        const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toEqual(httpStatus.OK);
  
        expect(response.body).toEqual(
          {
            id: booking.id,
            Room: {
                id: room.id,
                name: room.name,
                capacity: room.capacity,
                hotelId: room.hotelId,
                createdAt: room.createdAt.toISOString(),
                updatedAt: room.updatedAt.toISOString()
            }
          });
      });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {

    it("should respond with status 403 when user doesnt have an enrollment yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when user doesnt have a ticket yet", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
        
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket doesnt include hotel", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeWithoutHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket is remote", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }
      
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket isnt paid", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
  
      it("should respond with status 400 when body type is incorrect", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: "string"
        }
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });

      it("should respond with status 400 when body is null", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);

        const body = {}
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });

      it("should respond with status 403 when user already booked", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)
        const booking = await createBooking(user.id, room.id)

        const body = {
          roomId: room.id
        }
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 404 when roomId not found", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);

        const body = {
          roomId: 0
        }
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      it("should respond with status 403 when room is full", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)
        
        const randomUser = await createUser();
        const randomUser2 = await createUser();
        const randomUser3 = await createUser();

        await createBooking(randomUser.id, room.id);
        await createBooking(randomUser2.id, room.id);
        await createBooking(randomUser3.id, room.id);
    
        const body = {
          roomId: room.id
        }
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 200 and booking id", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        
        const body = {
          roomId: room.id
        }

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);    
  
        expect(response.status).toEqual(httpStatus.OK);
  
        expect(response.body).toEqual(
          {
            bookingId: expect.any(Number),
      });
  });
});
});

describe("PUT /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/0");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {

    it("should respond with status 403 when user doesnt have an enrollment yet", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }

        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);
    
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when user doesnt have a ticket yet", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }
    
        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
        
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket doesnt include hotel", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeWithoutHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }

        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket is remote", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeRemote();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }
      
        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
    
      it("should respond with status 403 when ticket isnt paid", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }

        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
  
      it("should respond with status 400 when body type is incorrect", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);

        const body = {
          roomId: "string"
        }
        
        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });

      it("should respond with status 400 when body is null", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);

        const body = {}
        
        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.BAD_REQUEST);
      });

      it("should respond with status 403 when user doesnt have booking", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: room.id
        }
        
        const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 404 when roomId not found", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)
        const booking = await createBooking(user.id, room.id)

        const body = {
          roomId: 0
        }
        
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
      });

      it("should respond with status 401 when user doesnt have the booking", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)
        const booking = await createBooking(user.id, room.id)

        const randomUser = await createUser();
        const booking2 = await createBooking(randomUser.id, room.id)

        const roomForUpdate = await createRoomWithHotelId(hotel.id)

        const body = {
          roomId: roomForUpdate.id
        }
        
        const response = await server.put(`/booking/${booking2.id}`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.UNAUTHORIZED);
      });

      it("should respond with status 403 when user tries to update to the same room", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)
        const booking = await createBooking(user.id, room.id)

        const body = {
          roomId: room.id
        }
        
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 403 when room is full", async () => {
        const user = await createUser();
        const enrollment = await createEnrollmentWithAddress(user);
        const token = await generateValidToken(user);
        const ticketType = await createTicketTypeHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id)
        const room2 = await createRoomWithHotelId(hotel.id)
        
        const booking = await createBooking(user.id, room2.id)

        const randomUser = await createUser();
        const randomUser2 = await createUser();
        const randomUser3 = await createUser();

        await createBooking(randomUser.id, room.id);
        await createBooking(randomUser2.id, room.id);
        await createBooking(randomUser3.id, room.id);
    
        const body = {
          roomId: room.id
        }
        
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);    
      
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });

      it("should respond with status 200 and booking id", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const room2 = await createRoomWithHotelId(hotel.id)

        const booking = await createBooking(user.id, room.id)

        const body = {
          roomId: room2.id
        }

        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);    
  
        expect(response.status).toEqual(httpStatus.OK);
  
        expect(response.body).toEqual(
          {
            bookingId: expect.any(Number),
      });
  });
});
});