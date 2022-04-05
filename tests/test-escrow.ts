import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TestEscrow } from "../target/types/test_escrow";

describe("test-escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TestEscrow as Program<TestEscrow>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
