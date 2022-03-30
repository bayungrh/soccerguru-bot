imageName=bayungrh/soccerguru-bot
containerName=soccerguru-bot

echo ":: Build image"
docker build -t $imageName  .

echo ":: Kill container"
docker kill $containerName || true

echo ":: Delete old container..." 
docker rm -f $containerName || true

echo ":: Run new container..."    
docker run -d -p 5000:5000 --name $containerName $imageName

echo ":: Clean all <none> tag image..." 
docker rmi $(docker images -f "dangling=true" -q) --force