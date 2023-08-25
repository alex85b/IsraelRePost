import { INewServiceRecord } from "../../interfaces/IDocumentBranch";

export interface INode {
	// Provides all the childe nodes of this Node.
	getChildren(): Promise<INode[] | null>;

	// Provides the useful part of the response to Axios API request.
	getResponse(): { [key: string]: string | number | boolean }[];

	// Provides an error if any occurred.
	getRequestError(): Error | null;
}
