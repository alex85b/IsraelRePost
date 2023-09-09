/*
    This class will update an object that represents a 'Branch' elasticsearch record.
*/

import {
	ElasticClient,
	IDocumentBranch,
	IErrorMapping,
	INewServiceRecord,
} from "../../elastic/elstClient";
import { INode } from "../requests-as-nodes/INode";
import { UserNode } from "../requests-as-nodes/UserNode";
import { IAxiosRequestSetup } from "../../api-requests/BranchRequest";
import { Result } from "@elastic/elasticsearch/lib/api/types";

export interface IBranchReport {
	branchNumber: number;
	requestsHadError: boolean | null;
	persistServicesSuccess: boolean | null;
	persistErrorsResult: Result | null;
}

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
	private servicesHaveErrors = false;
	private elasticClient: ElasticClient;
	private reason: string[] = [];
	private newErrors: IErrorMapping = {
		userError: "",
		services: [],
	};

	constructor(
		private branch: IDocumentBranch,
		private axiosSetup: IAxiosRequestSetup,
		private beforeRequest?: { id: number; callBack: (id: number) => Promise<void> }
	) {
		this.elasticClient = new ElasticClient();
	}

	async updateBranchServices() {
		await this.dfsDescent();
		const report: IBranchReport = {
			branchNumber: this.branch.branchnumber,
			persistServicesSuccess: null,
			persistErrorsResult: null,
			requestsHadError: this.servicesHaveErrors,
		};
		if (this.servicesHaveErrors) {
			report.persistErrorsResult =
				(await this.elasticClient.addSingleError(
					this.newErrors,
					String(this.branch.branchnumber)
				)) ?? null;
		}
		report.persistServicesSuccess =
			(await this.elasticClient.updateBranchServices(
				String(this.branch.branchnumber),
				this.newServices
			)) ?? null;

		return report;
	}

	private async dfsDescent() {
		this.stack.push(
			new UserNode(
				this.axiosSetup,
				this.branch.qnomycode,
				this.newServices,
				this.newErrors,
				this.beforeRequest
			)
		);

		while (this.stack.length) {
			const node = this.stack.pop();
			if (!node) break;
			const childNodes = await node.getChildren();
			if (childNodes === null) {
				const error = node.getRequestError();
				if (error !== null) this.servicesHaveErrors = true;
				continue;
			}
			for (let index = childNodes.length - 1; index > -1; index--) {
				this.stack.push(childNodes[index]);
			}
		}
	}
}
