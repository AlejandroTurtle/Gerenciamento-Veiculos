# Gerenciamento de Veículos

API REST para cadastrar e consultar veículos e motoristas, além de registrar o uso de um veículo por um motorista.

## Stack

- Node.js `22.22.2` e TypeScript 7
- Express 5 para as rotas HTTP
- Zod 4 para validar bodies e filtros
- UUID 14 para identificar os registros
- Arquivos JSON em `src/database/` para persistência local
- Testes com `node:test`

## Como executar

Requer Node.js e npm. Na raiz do projeto:

```bash
npm install
npm run dev
```

A API inicia em `http://localhost:3000`. Para usar outra porta, defina `PORT`, por exemplo `PORT=4000 npm run dev`.

Para compilar e iniciar a versão de produção:

```bash
npm run build
npm start
```

## Comandos

| Comando                 | Descrição                                                 |
| ----------------------- | --------------------------------------------------------- |
| `npm run dev`           | Inicia em modo de desenvolvimento com reinício automático |
| `npm run build`         | Compila TypeScript para `dist/`                           |
| `npm start`             | Inicia a versão compilada                                 |
| `npm run typecheck`     | Verifica os tipos da aplicação                            |
| `npm test`              | Verifica os tipos e executa os testes HTTP                |
| `npm run seed:vehicles` | Adiciona 10 veículos aleatórios aos JSONs locais          |
| `npm run seed:drivers`  | Adiciona 10 motoristas aleatórios aos JSONs locais        |

Os comandos `seed` acrescentam registros; executá-los novamente adiciona mais dados.

## Endpoints

Todos os endpoints recebem e retornam JSON quando aplicável. Para enviar bodies, use `Content-Type: application/json`.

### Veículos

| Método   | Caminho                        | Descrição                             |
| -------- | ------------------------------ | ------------------------------------- |
| `POST`   | `/veiculo/criar`               | Cadastra um veículo                   |
| `PUT`    | `/veiculo/editar/:id`          | Atualiza um veículo                   |
| `DELETE` | `/veiculo/deletar/:id`         | Exclui um veículo disponível          |
| `GET`    | `/veiculo/buscar/:id`          | Busca um veículo pelo ID              |
| `GET`    | `/veiculo?plate=&color=&mark=` | Lista veículos; filtros são opcionais |

Body para criar ou editar:

```json
{
  "plate": "ABC-1234",
  "color": "azul",
  "mark": "Fiat"
}
```

Placas aceitas: formato antigo (`ABC-1234` ou `ABC1234`) e Mercosul (`ABC1D23`). Os filtros de placa, cor e marca aceitam correspondências parciais.

### Motoristas

| Método   | Caminho                  | Descrição                                  |
| -------- | ------------------------ | ------------------------------------------ |
| `POST`   | `/motorista/criar`       | Cadastra um motorista                      |
| `PUT`    | `/motorista/editar/:id`  | Atualiza um motorista                      |
| `DELETE` | `/motorista/deletar/:id` | Exclui um motorista disponível             |
| `GET`    | `/motorista/buscar/:id`  | Busca um motorista pelo ID                 |
| `GET`    | `/motorista?name=`       | Lista motoristas; filtro opcional por nome |

Body para criar ou editar:

```json
{
  "name": "Ana Silva"
}
```

O filtro por nome aceita correspondências parciais.

### Utilização de veículos

| Método | Caminho                          | Descrição                                             |
| ------ | -------------------------------- | ----------------------------------------------------- |
| `POST` | `/reserva/veiculo/criar`         | Inicia uma utilização                                 |
| `PUT`  | `/reserva/veiculo/finalizar/:id` | Finaliza pelo ID da utilização                        |
| `GET`  | `/reserva/veiculo`               | Lista utilizações com dados do motorista e do veículo |

Body para iniciar uma utilização:

```json
{
  "vehicleId": "ID_DO_VEICULO",
  "driverId": "ID_DO_MOTORISTA",
  "reason": "Entrega de materiais"
}
```

A data de início é gerada pela API; a data de término fica `null` até a finalização. Ao iniciar, veículo e motorista ficam indisponíveis. Não é possível iniciar outra utilização nem excluir esses registros enquanto estiverem em uso.

### Respostas de erro

- `400 Bad Request`: body ou filtro inválido
- `404 Not Found`: veículo, motorista ou utilização não encontrada
- `409 Conflict`: placa duplicada, recurso em uso ou utilização já finalizada

## Persistência

Os dados são salvos localmente em `src/database/vehicles.json`, `src/database/drivers.json` e `src/database/vehicleUsage.json`. Não é necessário configurar um banco de dados externo.
