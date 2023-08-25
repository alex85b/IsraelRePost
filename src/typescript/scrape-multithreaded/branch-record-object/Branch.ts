/*
    This class will update an object that represents a 'Branch' elasticsearch record.
*/

import { UserRequest } from "../../api-requests/UserRequest";
import { IServicesConfigBuild, ServicesRequest } from "../../api-requests/ServicesRequest";
import { DatesRequest, IDatesConfigBuild } from "../../api-requests/DatesRequest";
import { TimesRequest } from "../../api-requests/TimesRequest";
import { IDocumentBranch, INewServiceRecord } from "../../interfaces/IDocumentBranch";
import { INode } from "../requests-as-nodes/INode";
import { UserNode } from "../requests-as-nodes/UserNode";
import { IAxiosRequestSetup } from "../../api-requests/BranchRequest";

export class Branch {
	// Root (Branch)
	// └── Service 1
	// |   └── Date 1.1
	// |       └── Time 1.1.1
	// |       └── Time 1.1.2
	// |       └── ...
	// |   └── Date 1.2
	// |   └── ...
	// └── Service 2
	// |   └── Date 2.1
	// |       └── Time 2.1.1
	// |       └── Time 2.1.2
	// |       └── ...
	// |   └── Date 2.2
	// |   └── ...
	// └── ...

	private stack: INode[] = [];
	private newServices: INewServiceRecord[] = [];

	constructor(private root: IDocumentBranch, private axiosSetup: IAxiosRequestSetup) {}

	async updateBranchObject() {
		await this.dfsDescent();
		return this.newServices;
	}

	private async dfsDescent() {
		this.stack.push(new UserNode(this.axiosSetup, this.root.qnomycode, this.newServices));

		while (this.stack.length) {
			const node = this.stack.pop();
			if (!node) break;
			const childNodes = await node.getChildren();
			if (!childNodes) continue;
			for (let index = childNodes.length - 1; index > -1; index--) {
				this.stack.push(childNodes[index]);
			}
		}
	}
}
