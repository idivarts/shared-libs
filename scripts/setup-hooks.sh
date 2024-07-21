#!/bin/bash

cp ./shared-libs/scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

cp ./shared-libs/scripts/pre-commit .git/modules/shared-libs/hooks/pre-commit
chmod +x .git/modules/shared-libs/hooks/pre-commit

cp ./shared-libs/scripts/pre-commit .git/modules/shared-uis/hooks/pre-commit
chmod +x .git/modules/shared-uis/hooks/pre-commit

cp ./shared-libs/scripts/pre-commit .git/modules/shared-constants/hooks/pre-commit
chmod +x .git/modules/shared-constants/hooks/pre-commit