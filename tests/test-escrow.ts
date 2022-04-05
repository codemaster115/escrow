import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  associatedAddress,
  ASSOCIATED_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@project-serum/anchor/dist/cjs/utils/token";
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TestEscrow } from "../target/types/test_escrow";

let mint1 = new anchor.web3.PublicKey(
  "AgSXZJCG9rmj6zcamhtZsiHzoJyqvVQWGXp6BcdGCxVN"
);
let mint2 = new anchor.web3.PublicKey(
  "D6dTgQ5Tz6fodXxFvs51Y2EPiFxiV6abE7fW5wZgimDj"
);
let user1 = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array([
    48, 55, 7, 132, 135, 100, 49, 66, 167, 93, 221, 229, 253, 96, 160, 57, 178,
    27, 111, 129, 222, 104, 177, 90, 111, 201, 107, 64, 163, 187, 32, 102, 94,
    105, 34, 183, 88, 218, 73, 76, 250, 24, 21, 92, 43, 43, 237, 126, 55, 129,
    71, 26, 192, 99, 84, 117, 99, 50, 249, 237, 127, 196, 232, 208,
  ])
);

describe("test-escrow", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.TestEscrow as Program<TestEscrow>;

  it("Deposit Token1 Success!", async () => {
    // Add your test here.
    const amount = new anchor.BN(10000);
    const [escrow] = findProgramAddressSync(
      [mint1.toBuffer()],
      program.programId
    );
    const userToken = await associatedAddress({
      mint: mint1,
      owner: anchor.getProvider().wallet.publicKey,
    });
    const escrowToken = await associatedAddress({
      mint: mint1,
      owner: escrow,
    });
    let balance = await anchor
      .getProvider()
      .connection.getTokenAccountBalance(userToken);
    console.log("Token balance: ", balance.value.uiAmountString);
    const tx = await program.methods
      .deposit(amount)
      .accounts({
        escrow,
        escrowToken,
        mint: mint1,
        userToken,
        authority: anchor.getProvider().wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Deposit Token2 Success!", async () => {
    const amount = new anchor.BN(10000);
    const [escrow] = findProgramAddressSync(
      [mint2.toBuffer()],
      program.programId
    );
    const userToken = await associatedAddress({
      mint: mint2,
      owner: user1.publicKey,
    });
    const escrowToken = await associatedAddress({
      mint: mint2,
      owner: escrow,
    });
    console.log(
      "Token balance: ",
      (await anchor.getProvider().connection.getTokenAccountBalance(userToken))
        .value.uiAmountString
    );
    const tx = await program.methods
      .deposit(amount)
      .accounts({
        escrow,
        escrowToken,
        mint: mint2,
        userToken,
        authority: user1.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Withdraw Token1 to user1:", async () => {
    const amount = new anchor.BN(10000);
    const [escrow] = findProgramAddressSync(
      [mint1.toBuffer()],
      program.programId
    );
    const userToken = await associatedAddress({
      mint: mint1,
      owner: user1.publicKey,
    });
    const escrowToken = await associatedAddress({
      mint: mint1,
      owner: escrow,
    });
    const tx = await program.methods
      .withdraw(amount)
      .accounts({
        escrow,
        escrowToken,
        mint: mint1,
        userToken,
        authority: user1.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Withdraw Token2 to user:", async () => {
    const amount = new anchor.BN(10000);
    const [escrow] = findProgramAddressSync(
      [mint2.toBuffer()],
      program.programId
    );
    const userToken = await associatedAddress({
      mint: mint2,
      owner: anchor.getProvider().wallet.publicKey,
    });
    const escrowToken = await associatedAddress({
      mint: mint2,
      owner: escrow,
    });
    const tx = await program.methods
      .withdraw(amount)
      .accounts({
        escrow,
        escrowToken,
        mint: mint2,
        userToken,
        authority: anchor.getProvider().wallet.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log("Your transaction signature", tx);
  });
});
