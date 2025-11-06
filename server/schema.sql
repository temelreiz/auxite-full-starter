-- PlanetScale/Vitess uyumlu minimal şema (FK YOK)

CREATE TABLE IF NOT EXISTS wallet_users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  wallet_addr   VARBINARY(20)   NOT NULL,          -- 20 byte EVM addr
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_wallet_users_addr (wallet_addr)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS balances (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,         -- FK YOK, index var
  symbol         VARCHAR(16)     NOT NULL,         -- AUXG/AUXS/AUXPT/AUXPD/USDT…
  amount         DECIMAL(38, 18) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_balances_user_symbol (user_id, symbol),
  KEY idx_balances_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS oracle_updates (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  chain_id        INT            NOT NULL,
  oracle_address  VARBINARY(20)  NOT NULL,
  price_e6        BIGINT         NOT NULL,         -- 131500000 -> 131.5 USD
  round_id        BIGINT         NOT NULL DEFAULT 0,
  updated_at_ts   BIGINT         NOT NULL,         -- epoch (s)
  received_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_oracle_updates_addr_time (oracle_address, updated_at_ts),
  KEY idx_oracle_updates_chain_time (chain_id, updated_at_ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Son fiyat view’i (FK gerektirmez)
CREATE OR REPLACE VIEW v_oracle_latest AS
SELECT ou1.*
FROM oracle_updates ou1
JOIN (
  SELECT oracle_address, MAX(updated_at_ts) AS max_ts
  FROM oracle_updates
  GROUP BY oracle_address
) last ON last.oracle_address = ou1.oracle_address AND last.max_ts = ou1.updated_at_ts;

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor       VARCHAR(64)     NOT NULL,
  action      VARCHAR(64)     NOT NULL,
  meta        JSON            NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
