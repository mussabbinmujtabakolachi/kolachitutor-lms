import { Request, Response } from 'express';
export declare const getCourseDetails: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllCourseDetails: (req: Request, res: Response) => Promise<void>;
export declare const createCourseDetail: (req: Request, res: Response) => Promise<void>;
export declare const updateCourseDetail: (req: Request, res: Response) => Promise<void>;
export declare const deleteCourseDetail: (req: Request, res: Response) => Promise<void>;
export declare const createFolder: (req: Request, res: Response) => Promise<void>;
export declare const getFolders: (req: Request, res: Response) => Promise<void>;
export declare const deleteFolder: (req: Request, res: Response) => Promise<void>;
export declare const uploadResource: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createLinkResource: (req: Request, res: Response) => Promise<void>;
export declare const getResources: (req: Request, res: Response) => Promise<void>;
export declare const deleteResource: (req: Request, res: Response) => Promise<void>;
export declare const createLesson: (req: Request, res: Response) => Promise<void>;
export declare const getLessons: (req: Request, res: Response) => Promise<void>;
export declare const updateLesson: (req: Request, res: Response) => Promise<void>;
export declare const deleteLesson: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=courseDetailController.d.ts.map