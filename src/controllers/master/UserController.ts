import { StatusCodes } from "http-status-codes";
import logger from "../../utilities/log";
import { Request, type Response } from "express";
import { ResponseData } from "../../utilities";
import { Pagination } from "../../utilities/pagination";
import prisma from "../../config/database";

const UserController = {
  getAllUser: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string)
      );

      console.log(page);

      const [userData, count] = await Promise.all([
        prisma.user.findMany({
          skip: page.offset,
          take: page.limit,
          orderBy: { id: "desc" },
        }),
        prisma.user.count(),
      ]);

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            "Success",
            page.paginate({ count, rows: userData })
          )
        );
    } catch (error: any) {
      logger.error(error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json(
          ResponseData(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Internal server error" + error.message
          )
        );
    }
  },
};

export default UserController;
