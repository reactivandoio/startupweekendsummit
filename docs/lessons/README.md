# Lições

Erros que não eram óbvios e como foram resolvidos, para o próximo agente (ou pessoa) não repetir a depuração.
Uma lição por arquivo, nome `AAAA-MM-DD-assunto.md`, com três partes:

```
# <sintoma, com a assinatura literal do erro>

**Sintoma:** o que apareceu (mensagem exata, onde).
**Causa:** por que acontece.
**Correção:** o que fazer (comando, config ou código), e como confirmar.
Evidência: observado | corrigido | confirmado · Card: STA-n
```

Antes de depurar um erro, procure aqui (`grep -ri "<trecho do erro>" docs/lessons`) e na memória do termhub (`search_memory`, kind `lesson`).
