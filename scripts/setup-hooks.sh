#!/bin/bash

cp ./shared-libs/scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

cp ./shared-libs/scripts/pre-commit .git/modules/shared-libs/hooks/pre-commit
chmod +x .git/modules/shared-libs/hooks/pre-commit

# touch shared-uis/.git/hooks/pre-commit
# cp ./shared-libs/scripts/pre-commit shared-uis/.git/hooks/pre-commit
# chmod +x shared-uis/.git/hooks/pre-commit

# touch shared-constants/.git/hooks/pre-commit
# cp ./shared-libs/scripts/pre-commit shared-constants/.git/hooks/pre-commit
# chmod +x shared-constants/.git/hooks/pre-commit