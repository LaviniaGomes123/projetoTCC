package com.projeto_ordemservico.projeto_ordemservico;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class LoginApplication extends Application {
    @Override
    public void start(Stage stage) throws IOException {
        // Armazena o Stage principal em NavegacaoTelas.mainStage
        NavegacaoTelas.mainStage = stage;

        FXMLLoader fxmlLoader = new FXMLLoader(LoginApplication.class.getResource("Login.fxml"));
        Scene scene = new Scene(fxmlLoader.load(), 1087, 623); // Defina o tamanho da janela como quiser
        stage.setTitle("OS Lady Service - Login");
        stage.setScene(scene);
        stage.setResizable(false);  // Opcional, se quiser que o Stage não seja redimensionado
        stage.show();
    }

    public static void main(String[] args) {
        launch();
    }
}