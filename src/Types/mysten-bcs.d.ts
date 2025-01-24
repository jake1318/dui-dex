declare module "@mysten/bcs" {
  export class BcsWriter {
    constructor();
    write64(value: number | bigint): this;
    toBytes(): Uint8Array;
  }

  export const bcs: {
    u8(options?: any): any;
    u16(options?: any): any;
    u32(options?: any): any;
    u64(options?: any): any;
    u128(options?: any): any;
    u256(options?: any): any;
    bool(): any;
    string(): any;
    bytes(): any;
  };
}
