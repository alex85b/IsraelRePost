// import { CUMessageHandlers } from '../../../../continues-update/ContinuesUpdate';
// import { AbstractCustomWorker } from '../../../../custom-worker/AbstractCustomWorker';

// export type Message<H extends string> = {
// 	handlerName: H;
// 	handlerData?: any[];
// };

// type HandlerData<TH extends string> = {};

// type HandlerFunctions<H extends string> = {
// 	[K in H]: () => any[] | void;
// };

// // TH: Message Target Handler, the target handler-function name.
// export abstract class MessagesHandler<H extends string> {
// 	protected abstract functions: HandlerFunctions<H>;

// 	handle<P extends keyof HandlerFunctions<H>>(functionName: P) {
// 		const handler = this.functions[functionName];
// 		if (handler) {
// 			return handler();
// 		} else {
// 			throw Error(`[MessagesHandler][handle] unknown handler-name: ${functionName}`);
// 		}
// 	}
// }

// // #####################################################
// // ### Simple Test #####################################
// // #####################################################

// type testFunctionNames = 'This' | 'AndThis';

// class testClass extends MessagesHandler<testFunctionNames> {
// 	private data1 = 1;
// 	private data2 = 'qwe';

// 	protected functions: HandlerFunctions<testFunctionNames> = {
// 		This: () => {
// 			console.log(this.data1);
// 		},
// 		AndThis: () => {
// 			console.log(this.data2);
// 		},
// 	};
// }

// // #####################################################
// // ### Test Continues Updates ##########################
// // #####################################################

// class ContinuesUpdatesHandler extends MessagesHandler<CUMessageHandlers> {
// 	protected functions: HandlerFunctions<CUMessageHandlers> = {
// 		'manager-depleted': () => {
// 			console.log(this.num);
// 		},
// 		'manager-done': () => {},
// 	};
// 	private num;

// 	constructor(num: number) {
// 		super();
// 		this.num = num;
// 	}
// }

// const test = new ContinuesUpdatesHandler(10);
// test.handle('manager-depleted');

// // I have a problem with data.
// // I need operating data, changeable data as a function variable.
// // Data that cannot be stored in advance inside the Class itself.
