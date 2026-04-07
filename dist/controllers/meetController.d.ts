import { Request, Response } from 'express';
export declare const getGoogleAuthUrl: (req: Request, res: Response) => void;
export declare const googleCallback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getClasses: (req: Request, res: Response) => Promise<void>;
export declare const getClassById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const enrollInClass: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getClassHistory: (req: Request, res: Response) => Promise<void>;
export declare const getUpcomingClasses: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=meetController.d.ts.map