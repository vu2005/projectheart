import { Request, Response } from 'express';

class ExampleController {
    public async create(req: Request, res: Response): Promise<Response> {
        // Logic for creating a resource
        return res.status(201).json({ message: 'Resource created' });
    }

    public async read(req: Request, res: Response): Promise<Response> {
        // Logic for reading a resource
        return res.status(200).json({ message: 'Resource details' });
    }

    public async update(req: Request, res: Response): Promise<Response> {
        // Logic for updating a resource
        return res.status(200).json({ message: 'Resource updated' });
    }

    public async delete(req: Request, res: Response): Promise<Response> {
        // Logic for deleting a resource
        return res.status(204).send();
    }
}

export const exampleController = new ExampleController();