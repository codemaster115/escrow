use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};

declare_id!("4B2qNhMFbFtABusdne83HDZmF3Ze8QDWTbnNYcKmaE4C");

#[program]
pub mod test_escrow {
    use anchor_spl::token::transfer;

    use super::*;

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.mint = ctx.accounts.mint.key();
        escrow.bump = *ctx.bumps.get("escrow").unwrap();

        transfer(ctx.accounts.into(), amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };

        let mint = ctx.accounts.mint.key();
        let seeds = &[mint.as_ref(), &[ctx.accounts.escrow.bump]];
        let cpi_context =
            CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

        transfer(cpi_context.with_signer(&[seeds]), amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Deposit<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + Escrow::LEN,
        seeds = [mint.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = escrow
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        constraint = user_token.amount >= amount @ TransferError::NotEnoughBalance
    )]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> From<&mut Deposit<'info>> for CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
    fn from(accounts: &mut Deposit<'info>) -> Self {
        let cpi_accounts = Transfer {
            from: accounts.user_token.to_account_info(),
            to: accounts.escrow_token.to_account_info(),
            authority: accounts.authority.to_account_info(),
        };

        CpiContext::new(accounts.token_program.to_account_info(), cpi_accounts)
    }
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [mint.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        associated_token::mint = escrow.mint,
        associated_token::authority = escrow,
        constraint = escrow_token.amount >= amount @ TransferError::NotEnoughBalance
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    #[account(address = escrow.mint)]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority
    )]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct Escrow {
    mint: Pubkey,
    bump: u8,
}

impl Escrow {
    pub const LEN: usize = 32 + 1;
}

#[error_code]
enum TransferError {
    #[msg("Not enough balance in account")]
    NotEnoughBalance,
}
